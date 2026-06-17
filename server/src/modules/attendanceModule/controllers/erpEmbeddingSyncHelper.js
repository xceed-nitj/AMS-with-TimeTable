// server/src/modules/attendanceModule/controllers/erpEmbeddingSyncHelper.js
//
// The ML service must never assume it shares a filesystem with the Node
// server. This module owns all reading of server/ml-data/erp_photos/ and
// all reading/writing of server/ml-data/embeddings/erp/.../embeddings_db.pkl
// — Python only ever receives photo bytes / existing pkl bytes and returns
// updated pkl bytes, never a path. The saved .pkl format and location are
// unchanged: {roll_no: {"name", "embedding", "num_photos"}} at
// embeddings/erp/<department>/<batch>/embeddings_db.pkl.

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const ERP_PHOTOS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'erp_photos');
const ERP_EMB_DIR    = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings', 'erp');
const IMG_EXT_RE      = /\.(jpg|jpeg|png|webp)$/i;

// Mirrors Python's old sanitize_path_component — rejects path traversal.
// Used for the write/status path (single fixed location), matching the
// validation that ground_truth_routes.py applied before this migration.
function sanitizePathComponent(name) {
    const normalized = String(name || '').trim();
    if (!normalized) throw new Error('Empty path component');
    if (normalized.includes('..') || normalized.includes('/') || normalized.includes('\\')) {
        throw new Error(`Invalid path component: ${normalized}`);
    }
    return normalized;
}

// The single fixed write/status path: embeddings/erp/<department>/<batch>/embeddings_db.pkl
// (same formula Python's _erp_sync_background / status used before).
function pklPath(batch, department) {
    const batchSafe = sanitizePathComponent(batch);
    const deptSafe   = sanitizePathComponent(department);
    return path.join(ERP_EMB_DIR, deptSafe, batchSafe, 'embeddings_db.pkl');
}

function readPklBase64(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath).toString('base64');
}

// Atomic write (temp file + rename), matching the atomicity os.replace()
// gave the old _safe_update_pkl.
function writePklBase64(filePath, base64Data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, Buffer.from(base64Data, 'base64'));
    fs.renameSync(tmpPath, filePath);
}

/** Returns the roll numbers present in a .pkl, via Python (pickle is Python-specific). */
async function inspectPkl(filePath) {
    const pklData = readPklBase64(filePath);
    const response = await axios.post(
        `${ML_SERVICE_URL}/erp-embedding/inspect`,
        { pkl_data: pklData },
        { timeout: 30000 }
    );
    return response.data.roll_nos || [];
}

/**
 * Mirrors the old GET /erp-embedding/check — searches most-specific to
 * least-specific path (no sanitization, matching the original, which never
 * validated these particular inputs).
 * Returns { available, pkl_path, roll_count } — same shape as before.
 */
async function checkErpEmbedding(batch, department) {
    const candidates = [];
    if (department) candidates.push(path.join(ERP_EMB_DIR, department, batch, 'embeddings_db.pkl'));
    candidates.push(path.join(ERP_EMB_DIR, batch, 'embeddings_db.pkl'));

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            let rollCount = 0;
            try {
                const rollNos = await inspectPkl(candidate);
                rollCount = rollNos.length;
            } catch (_) { /* best-effort, matches old try/except pass */ }
            return { available: true, pkl_path: candidate, roll_count: rollCount };
        }
    }
    return { available: false, pkl_path: null, roll_count: 0 };
}

/**
 * Mirrors the old GET /erp-embedding/status/{batch} — same response shape:
 * { batch, department, total_photos, total_embeddings, missing_count,
 *   missing, orphaned_count, orphaned, last_sync_timestamp }
 */
async function getErpStatus(batch, department) {
    const batchSafe = sanitizePathComponent(batch);
    const deptSafe   = sanitizePathComponent(department || 'UNKNOWN_DEPT');

    const batchDir = path.join(ERP_PHOTOS_DIR, batchSafe);
    const dbPath   = path.join(ERP_EMB_DIR, deptSafe, batchSafe, 'embeddings_db.pkl');

    const photoRollNos = new Set();
    if (fs.existsSync(batchDir)) {
        for (const f of fs.readdirSync(batchDir)) {
            if (IMG_EXT_RE.test(f)) {
                photoRollNos.add(path.basename(f, path.extname(f)).toUpperCase());
            }
        }
    }

    let dbRollNos = new Set();
    let lastSync = null;
    if (fs.existsSync(dbPath)) {
        lastSync = fs.statSync(dbPath).mtimeMs;
        try {
            const rollNos = await inspectPkl(dbPath);
            dbRollNos = new Set(rollNos);
        } catch (err) {
            console.warn(`[ERP] Status inspect failed for ${dbPath}:`, err.message);
        }
    }

    const missing  = [...photoRollNos].filter(r => !dbRollNos.has(r));
    const orphaned = [...dbRollNos].filter(r => !photoRollNos.has(r));

    return {
        batch, department,
        total_photos:     photoRollNos.size,
        total_embeddings: dbRollNos.size,
        missing_count:     missing.length,
        missing:           missing.slice(0, 50),
        orphaned_count:    orphaned.length,
        orphaned:          orphaned.slice(0, 50),
        last_sync_timestamp: lastSync,
    };
}

/**
 * Mirrors the old _erp_sync_background — for each rollNo, finds its photo
 * file(s) in ERP_PHOTOS_DIR/<batch>/ (named "<rollNo>.<ext>"), sends bytes
 * + the existing pkl to Python, writes the returned pkl back.
 */
async function syncErpEmbeddings(batch, department, rollNos) {
    const batchDir = path.join(ERP_PHOTOS_DIR, batch);
    if (!fs.existsSync(batchDir)) return { status: 'skipped', reason: 'batch photo dir not found' };

    const allFiles = fs.readdirSync(batchDir);
    const students = [];
    for (const rollNo of rollNos) {
        const matches = allFiles.filter(f => f.toLowerCase().startsWith(`${rollNo.toLowerCase()}.`));
        if (!matches.length) continue;
        const photos = matches.map(filename => ({
            filename,
            data: fs.readFileSync(path.join(batchDir, filename)).toString('base64'),
        }));
        students.push({ roll_no: rollNo, photos });
    }

    const dbPath = pklPath(batch, department);
    const existingPklData = readPklBase64(dbPath);

    const response = await axios.post(
        `${ML_SERVICE_URL}/erp-embedding/sync`,
        { existing_pkl_data: existingPklData, students },
        { timeout: 300000 }
    );

    const { pkl_data, processed, skipped, total_roll_nos } = response.data;
    writePklBase64(dbPath, pkl_data);
    return { status: 'done', processed, skipped, total_roll_nos };
}

/** Mirrors the old _erp_rename_background — no-op if no pkl exists yet. */
async function renameErpEmbedding(batch, department, oldRollNo, newRollNo) {
    const dbPath = pklPath(batch, department);
    if (!fs.existsSync(dbPath)) return { status: 'skipped', reason: 'pkl not found' };

    const pklData = readPklBase64(dbPath);
    const response = await axios.post(
        `${ML_SERVICE_URL}/erp-embedding/rename`,
        { pkl_data: pklData, old_roll_no: oldRollNo, new_roll_no: newRollNo },
        { timeout: 30000 }
    );

    writePklBase64(dbPath, response.data.pkl_data);
    return { status: 'done', renamed: response.data.renamed };
}

/** Mirrors the old _erp_delete_background — no-op if no pkl exists yet. */
async function deleteErpEmbedding(batch, department, rollNo) {
    const dbPath = pklPath(batch, department);
    if (!fs.existsSync(dbPath)) return { status: 'skipped', reason: 'pkl not found' };

    const pklData = readPklBase64(dbPath);
    const response = await axios.post(
        `${ML_SERVICE_URL}/erp-embedding/delete`,
        { pkl_data: pklData, roll_no: rollNo },
        { timeout: 30000 }
    );

    writePklBase64(dbPath, response.data.pkl_data);
    return { status: 'done', deleted: response.data.deleted };
}

module.exports = {
    checkErpEmbedding,
    getErpStatus,
    syncErpEmbeddings,
    renameErpEmbedding,
    deleteErpEmbedding,
    pklPath,
    readPklBase64,
    ERP_PHOTOS_DIR,
    ERP_EMB_DIR,
};

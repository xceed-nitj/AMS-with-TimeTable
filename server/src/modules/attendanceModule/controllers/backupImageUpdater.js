// server/src/modules/attendanceModule/controllers/backupImageUpdater.js
//
// Issue #1512 — Backup images update (active learning loop)
//
// Maintainer guidance (from PR review):
//   1. Do NOT re-extract crops from raw frames — face_cluster.py already
//      saves cropped faces per student, with a confidence score, after
//      every attendance check (see attendanceSessionController.js →
//      "Run face_cluster.py automation"). Use that output directly.
//   2. Only update backup_files. Never touch embedding_files — those
//      require manual approval (via the embedding rebuild UI flow).
//   3. Backup cap raised from 5 to 10.
//   4. At most ONE new backup image per student per calendar day —
//      do not replace all backups at once.
//   5. Backups should not all look similar — enforce some diversity
//      across angles/sessions rather than always taking the latest.
//
// Where this plugs in: called (fire-and-forget, like face_cluster.py
// itself) right after face_cluster.py finishes writing its cluster output
// for a session, from attendanceSessionController.js.
//
// Input it reads (already written to disk by face_cluster.py):
//   server/ml-data/faces/{dept}/{date}/{sem}/{period}/cluster_{rollNo}_{hash}/
//       image_001.jpg, image_002.jpg, ...   (sorted, image_001 = best quality)
//       metadata.json  → { rollNo, confidence, imageCount, sourceSession, type }
//
// Output it writes (only inside the student's existing ground_truth folder):
//   server/ml-data/ground_truth/{batch}/{rollNo}/
//       backup_{date}_{rollNo}.jpg          (new crop, copied from cluster image_001.jpg)
//       _info.json → backup_files updated, embedding_files left untouched

'use strict';

const fs   = require('fs');
const fsP  = require('fs').promises;
const path = require('path');

const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');
const FACES_DIR         = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'faces');

const BACKUP_CAP                 = 10;   // raised from 5 per maintainer request
const MIN_CONFIDENCE_FOR_BACKUP  = 0.40; // must be at least a confident ("present") match

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadInfo(studentDir) {
    const infoPath = path.join(studentDir, '_info.json');
    if (!fs.existsSync(infoPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    } catch (_) {
        return {};
    }
}

function saveInfo(studentDir, info) {
    const infoPath = path.join(studentDir, '_info.json');
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
}

// Find the ground_truth/{batch}/{rollNo} folder for a roll number.
// Prefers a batch folder name containing the department, same approach
// embeddingController.js already uses (findStudentDir).
async function findStudentDir(rollNo, deptHint) {
    if (!fs.existsSync(GROUND_TRUTH_DIR)) return null;
    const batchFolders = await fsP.readdir(GROUND_TRUTH_DIR);
    const sorted = deptHint
        ? [
            ...batchFolders.filter(b => b.toUpperCase().includes(deptHint.toUpperCase())),
            ...batchFolders.filter(b => !b.toUpperCase().includes(deptHint.toUpperCase())),
          ]
        : batchFolders;
    for (const batch of sorted) {
        const candidate = path.join(GROUND_TRUTH_DIR, batch, rollNo);
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

// Extract the calendar date a backup filename was added on.
// New filenames: backup_{YYYY-MM-DD}_{rollNo}.jpg
function backupDateOf(filename) {
    const m = /^backup_(\d{4}-\d{2}-\d{2})_/.exec(filename);
    return m ? m[1] : null;
}

// Extract the session identifier a backup came from, if we recorded one.
// Stored in info.backup_sessions: { filename: sourceSession }
function sessionOf(info, filename) {
    return (info.backup_sessions || {})[filename] || null;
}

// ── Core: process one student's best cluster for today ────────────────────────

/**
 * @param {string} rollNo
 * @param {object} meta          - parsed metadata.json for this student's cluster
 * @param {string} clusterDir    - folder containing image_001.jpg, image_002.jpg, ...
 * @param {string} dateStr       - "YYYY-MM-DD" — the session's calendar date
 * @param {string} deptHint      - department, used to locate the right batch folder
 * @returns {Promise<{rollNo, action, reason?}>}
 */
async function maybeAddBackup(rollNo, meta, clusterDir, dateStr, deptHint) {
    if (meta.type !== 'known' || !meta.confidence || meta.confidence < MIN_CONFIDENCE_FOR_BACKUP) {
        return { rollNo, action: 'skipped', reason: 'low_confidence' };
    }

    const studentDir = await findStudentDir(rollNo, deptHint);
    if (!studentDir) {
        return { rollNo, action: 'skipped', reason: 'no_ground_truth_folder' };
    }

    const info = loadInfo(studentDir);
    const embeddingFiles = info.embedding_files || [];          // never modified
    let   backupFiles    = [...(info.backup_files || [])];
    const scores          = { ...(info.scores || {}) };
    const backupSessions  = { ...(info.backup_sessions || {}) };

    // ── Rule: at most ONE new backup per student per calendar day ────────────
    const alreadyToday = backupFiles.some(f => backupDateOf(f) === dateStr);
    if (alreadyToday) {
        return { rollNo, action: 'skipped', reason: 'already_added_today' };
    }

    // ── Rule: enforce angle/session diversity ─────────────────────────────────
    // Reject if the most recent existing backup came from the exact same
    // session (sourceSession) — that would mean two backups from the same
    // few minutes of footage, almost certainly the same angle/expression.
    const sameSessionExists = backupFiles.some(
        f => sessionOf(info, f) === meta.sourceSession
    );
    if (sameSessionExists) {
        return { rollNo, action: 'skipped', reason: 'same_session_as_existing_backup' };
    }

    // ── Best crop for this student today: image_001.jpg (already sorted by
    //    face_cluster.py — highest quality face first within the cluster) ────
    const bestImagePath = path.join(clusterDir, 'image_001.jpg');
    if (!fs.existsSync(bestImagePath)) {
        return { rollNo, action: 'skipped', reason: 'no_image_found' };
    }

    const newFilename = `backup_${dateStr}_${rollNo}.jpg`;
    const newFilePath = path.join(studentDir, newFilename);

    try {
        await fsP.copyFile(bestImagePath, newFilePath);
    } catch (err) {
        return { rollNo, action: 'failed', reason: err.message };
    }

    backupFiles.push(newFilename);
    scores[newFilename]         = meta.confidence;
    backupSessions[newFilename] = meta.sourceSession;

    // ── Rule: cap at BACKUP_CAP — evict the OLDEST backup if over capacity ───
    // "Oldest" by date encoded in filename, so the rotation always keeps the
    // most recent BACKUP_CAP days of variation rather than the highest-score
    // ones (a single very-high-confidence day shouldn't crowd out diversity).
    if (backupFiles.length > BACKUP_CAP) {
        backupFiles.sort((a, b) => {
            const da = backupDateOf(a) || '';
            const db = backupDateOf(b) || '';
            return da.localeCompare(db); // ascending — oldest first
        });
        const toDrop = backupFiles.slice(0, backupFiles.length - BACKUP_CAP);
        backupFiles = backupFiles.slice(backupFiles.length - BACKUP_CAP);

        for (const dropFile of toDrop) {
            const dropPath = path.join(studentDir, dropFile);
            try {
                if (fs.existsSync(dropPath)) await fsP.unlink(dropPath);
            } catch (_) { /* non-fatal */ }
            delete scores[dropFile];
            delete backupSessions[dropFile];
        }
    }

    info.embedding_files  = embeddingFiles;   // explicitly unchanged
    info.backup_files     = backupFiles;
    info.scores           = scores;
    info.backup_sessions  = backupSessions;

    saveInfo(studentDir, info);

    return { rollNo, action: 'added', confidence: meta.confidence, totalBackups: backupFiles.length };
}

// ── Entry point: process an entire face_cluster.py output folder ──────────────

/**
 * Called right after face_cluster.py finishes for a session.
 *
 * @param {string} outputDir  - the --output_dir passed to face_cluster.py
 *                               (server/ml-data/faces/{dept}/{date}/{sem}/{period})
 * @param {string} dateStr    - "YYYY-MM-DD" for the session
 * @param {string} deptHint   - department string, for locating the batch folder
 */
async function updateBackupsFromSession(outputDir, dateStr, deptHint) {
    const tag = '[BackupUpdate]';

    if (!fs.existsSync(outputDir)) {
        console.log(`${tag} Output dir not found, skipping: ${outputDir}`);
        return { processed: 0, results: [] };
    }

    let clusterFolders = [];
    try {
        clusterFolders = (await fsP.readdir(outputDir, { withFileTypes: true }))
            .filter(e => e.isDirectory() && e.name.startsWith('cluster_') && !e.name.startsWith('cluster_unknown_'))
            .map(e => e.name);
    } catch (err) {
        console.warn(`${tag} Could not read ${outputDir}: ${err.message}`);
        return { processed: 0, results: [] };
    }

    const results = [];

    for (const folderName of clusterFolders) {
        const clusterDir = path.join(outputDir, folderName);
        const metaPath   = path.join(clusterDir, 'metadata.json');

        if (!fs.existsSync(metaPath)) continue;

        let meta;
        try {
            meta = JSON.parse(await fsP.readFile(metaPath, 'utf8'));
        } catch (_) {
            continue;
        }

        const rollNo = meta.rollNo;
        if (!rollNo || rollNo === 'unknown') continue;

        const result = await maybeAddBackup(rollNo, meta, clusterDir, dateStr, deptHint);
        results.push(result);

        if (result.action === 'added') {
            console.log(
                `${tag} ${rollNo}: added backup ` +
                `(confidence=${result.confidence.toFixed(2)}, ` +
                `total=${result.totalBackups}/${BACKUP_CAP})`
            );
        }
    }

    const added   = results.filter(r => r.action === 'added').length;
    const skipped = results.filter(r => r.action === 'skipped').length;
    console.log(`${tag} Done — ${added} backup(s) added, ${skipped} skipped, ${results.length} clusters checked`);

    return { processed: results.length, results };
}

module.exports = { updateBackupsFromSession, maybeAddBackup, BACKUP_CAP };

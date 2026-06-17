// server/src/modules/attendanceModule/controllers/embeddingSyncHelper.js
//
// The ML service must never assume it shares a filesystem with the Node
// server (it may run on a separate GPU machine). These helpers own all
// reading of ground-truth photos / _info.json and writing of the resulting
// .pkl files — Python only ever receives photo bytes and returns embedding
// data, never a path.
//
// Mirrors the contract of POST /update-student-embedding and
// POST /build-embeddings-sync in python-ml-service/ground_truth_routes.py.

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const IMG_EXT_RE      = /\.(jpg|jpeg|png|webp)$/i;

function readPhotoBytes(studentDir, filenames) {
    const photos = [];
    for (const filename of filenames) {
        if (filename.startsWith('_')) continue;
        const fpath = path.join(studentDir, filename);
        if (!fs.existsSync(fpath)) continue;
        try {
            photos.push({ filename, data: fs.readFileSync(fpath).toString('base64') });
        } catch (_) { /* skip unreadable file */ }
    }
    return photos;
}

function readInfoJson(studentDir) {
    const infoPath = path.join(studentDir, '_info.json');
    if (!fs.existsSync(infoPath)) return {};
    try { return JSON.parse(fs.readFileSync(infoPath, 'utf8')); }
    catch (_) { return {}; }
}

function writeInfoJson(studentDir, info) {
    fs.mkdirSync(studentDir, { recursive: true });
    fs.writeFileSync(path.join(studentDir, '_info.json'), JSON.stringify(info, null, 2));
}

/**
 * Recompute a student's mean embedding from a chosen set of embedding
 * files, then persist embedding_files/backup_files/mean_embedding into
 * _info.json (same fields the ML service used to write itself).
 * @returns {Promise<object>} the ML service's response
 *   { status, roll_no, embedding_files_used, total_selected, missing_files, mean_embedding }
 */
async function updateStudentEmbedding(studentDir, rollNo, embeddingFiles) {
    const photos = readPhotoBytes(studentDir, embeddingFiles);

    const response = await axios.post(
        `${ML_SERVICE_URL}/update-student-embedding`,
        { roll_no: rollNo, photos },
        { timeout: 60000 }
    );
    const result = response.data;

    const allImgs = fs.existsSync(studentDir)
        ? fs.readdirSync(studentDir).filter(f => IMG_EXT_RE.test(f))
        : [];
    const info = readInfoJson(studentDir);
    info.embedding_files = embeddingFiles.filter(f => allImgs.includes(f));
    info.backup_files    = allImgs.filter(f => !embeddingFiles.includes(f)).slice(0, 5);
    if (Array.isArray(result.mean_embedding)) info.mean_embedding = result.mean_embedding;
    writeInfoJson(studentDir, info);

    return result;
}

/**
 * Build the per-student payload for /build-embeddings-sync: a cached mean
 * embedding if _info.json already has one (fast path, no photo bytes
 * needed), otherwise the raw bytes of that student's embedding photos
 * (falling back to every image in the folder if _info.json has none
 * tracked) — mirrors the old Python use_cached_embeddings logic exactly.
 */
function buildStudentPayload(rollNo, name, studentDir) {
    const info = readInfoJson(studentDir);

    if (Array.isArray(info.mean_embedding) && info.mean_embedding.length > 0) {
        return {
            roll_no:               rollNo,
            name,
            cached_mean_embedding: info.mean_embedding,
            num_photos_cached:     (info.embedding_files || []).length,
            photos:                [],
        };
    }

    const allImgs = fs.existsSync(studentDir)
        ? fs.readdirSync(studentDir).filter(f => IMG_EXT_RE.test(f))
        : [];
    let photoFiles = allImgs;
    if (Array.isArray(info.embedding_files) && info.embedding_files.length > 0) {
        const filtered = info.embedding_files.filter(f => allImgs.includes(f));
        if (filtered.length > 0) photoFiles = filtered;
    }

    return {
        roll_no:               rollNo,
        name,
        cached_mean_embedding: null,
        num_photos_cached:     0,
        photos:                readPhotoBytes(studentDir, photoFiles),
    };
}

// Mirrors Python's old folder-name parsing: "21CS001_John_Doe" → id="21CS001", name="John Doe"
function parseStudentFolder(folder) {
    const idx = folder.indexOf('_');
    if (idx === -1) return { rollNo: folder, name: folder };
    return { rollNo: folder.slice(0, idx), name: folder.slice(idx + 1).replace(/_/g, ' ') };
}

/**
 * Build a .pkl for every student subfolder under batchDir and write it to
 * outputPath. Matches the prior /build-embeddings-sync behavior, which
 * always processed every folder in photos_dir (roll_nos was accepted but
 * never actually used as a filter).
 */
async function buildBatchEmbeddingsPkl(batchDir, outputPath) {
    const students = [];
    if (fs.existsSync(batchDir)) {
        for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
            const { rollNo, name } = parseStudentFolder(entry.name);
            students.push({ rollNo, name, studentDir: path.join(batchDir, entry.name) });
        }
    }
    students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

    const payload = students.map(({ rollNo, name, studentDir }) => buildStudentPayload(rollNo, name, studentDir));

    const response = await axios.post(
        `${ML_SERVICE_URL}/build-embeddings-sync`,
        { students: payload },
        { timeout: 900000 }
    );
    const { students_enrolled, pkl_data } = response.data;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(pkl_data, 'base64'));

    return { status: 'done', students_enrolled, output_path: outputPath };
}

/**
 * Same as buildBatchEmbeddingsPkl, but for an explicit list of {rollNo,
 * studentDir} pairs rather than every folder in a directory — used when
 * the roster is known up front (e.g. a subject's enrolled roll numbers)
 * and the student folders aren't all siblings under one batchDir.
 */
async function buildEmbeddingsPklForStudents(students, outputPath) {
    const payload = students.map(({ rollNo, name, studentDir }) =>
        buildStudentPayload(rollNo, name || rollNo, studentDir));

    const response = await axios.post(
        `${ML_SERVICE_URL}/build-embeddings-sync`,
        { students: payload },
        { timeout: 900000 }
    );
    const { students_enrolled, pkl_data } = response.data;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(pkl_data, 'base64'));

    return { status: 'done', students_enrolled, output_path: outputPath };
}

module.exports = {
    updateStudentEmbedding,
    buildBatchEmbeddingsPkl,
    buildEmbeddingsPklForStudents,
    parseStudentFolder,
};

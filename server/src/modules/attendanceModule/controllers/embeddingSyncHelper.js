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
    if (Array.isArray(result.top_k_embeddings) && result.top_k_embeddings.length > 0) {
        info.top_k_embeddings = result.top_k_embeddings;
    } else {
        delete info.top_k_embeddings;
    }
    // AdaFace — entirely separate embedding, only present when Python has an
    // ONNX model loaded (state.adaface_session). Never affects the fields above.
    if (Array.isArray(result.adaface_mean_embedding) && result.adaface_mean_embedding.length > 0) {
        info.adaface_mean_embedding = result.adaface_mean_embedding;
    } else {
        delete info.adaface_mean_embedding;
    }
    if (Array.isArray(result.adaface_top_k_embeddings) && result.adaface_top_k_embeddings.length > 0) {
        info.adaface_top_k_embeddings = result.adaface_top_k_embeddings;
    } else {
        delete info.adaface_top_k_embeddings;
    }
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
            cached_adaface_mean_embedding: Array.isArray(info.adaface_mean_embedding)
                ? info.adaface_mean_embedding : null,
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
        cached_adaface_mean_embedding: null,
    };
}

/**
 * Build the existingFolders payload for /extract-rtsp-stream: for every
 * subfolder under batchDir, read its _info.json and up to 5 representative
 * photo bytes (embedding_files if present, else first images found). Used
 * to seed Python's in-memory existing-folder state during live RTSP capture
 * without Python needing direct filesystem access to ground_truth/.
 */
function buildExistingFoldersPayload(batchDir) {
    const result = [];
    if (!fs.existsSync(batchDir)) return result;
    for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
        const folderPath = path.join(batchDir, entry.name);
        const infoJson   = readInfoJson(folderPath);
        const allImgs    = fs.readdirSync(folderPath).filter(f => IMG_EXT_RE.test(f));
        if (allImgs.length === 0) continue;

        let photoFiles = allImgs;
        if (Array.isArray(infoJson.embedding_files) && infoJson.embedding_files.length > 0) {
            const filtered = infoJson.embedding_files.filter(f => allImgs.includes(f));
            if (filtered.length > 0) photoFiles = filtered;
        }

        result.push({
            folderName: entry.name,
            infoJson,
            photos: readPhotoBytes(folderPath, photoFiles.slice(0, 5)),
        });
    }
    return result;
}

/**
 * Collect each enrolled student's cached mean_embedding from _info.json for
 * an RTSP attendance run. Students with no cached mean_embedding are
 * skipped — deliberately no fallback to recomputing from raw/backup photos,
 * since that recomputation only happens via the approve/update-embedding
 * flows, which keep mean_embedding fresh. person_XXX folders (unmatched RTSP
 * clusters, not enrolled students) are excluded.
 */
function buildEnrolledEmbeddings(groundTruthDir, batch) {
    const batchDir = path.join(groundTruthDir, batch);
    const enrolled = {};
    if (!fs.existsSync(batchDir)) return enrolled;
    for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
        if (/^person_\d+$/i.test(entry.name)) continue;
        const info = readInfoJson(path.join(batchDir, entry.name));
        if (Array.isArray(info.mean_embedding) && info.mean_embedding.length > 0) {
            enrolled[entry.name] = info.mean_embedding;
        }
    }
    return enrolled;
}

/**
 * Same as buildEnrolledEmbeddings, but for the "max-of-K" shadow comparison
 * mode: collects each enrolled student's cached top_k_embeddings (multiple
 * vectors per student, ranked by photo quality) instead of one mean vector.
 * Students not yet regenerated under the new logic (no top_k_embeddings
 * cached yet) fall back to a K=1 list built from their existing
 * mean_embedding, so the shadow comparison still covers every enrolled
 * student, just without the full benefit until their embedding is next
 * regenerated.
 */
function buildEnrolledEmbeddingsTopK(groundTruthDir, batch) {
    const batchDir = path.join(groundTruthDir, batch);
    const enrolled = {};
    if (!fs.existsSync(batchDir)) return enrolled;
    for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
        if (/^person_\d+$/i.test(entry.name)) continue;
        const info = readInfoJson(path.join(batchDir, entry.name));
        if (Array.isArray(info.top_k_embeddings) && info.top_k_embeddings.length > 0) {
            enrolled[entry.name] = info.top_k_embeddings;
        } else if (Array.isArray(info.mean_embedding) && info.mean_embedding.length > 0) {
            enrolled[entry.name] = [info.mean_embedding];
        }
    }
    return enrolled;
}

/**
 * AdaFace equivalents of buildEnrolledEmbeddings/buildEnrolledEmbeddingsTopK —
 * entirely separate embedding space, read from the adaface_* keys in the
 * same _info.json. No K=1 mean fallback here (unlike buildEnrolledEmbeddingsTopK):
 * callers already gate the whole AdaFace shadow-comparison feature on
 * state.adaface_config.enabled, so a student with no AdaFace data yet is
 * simply omitted rather than backed by a meaningless cross-model fallback.
 */
function buildEnrolledEmbeddingsAdaface(groundTruthDir, batch) {
    const batchDir = path.join(groundTruthDir, batch);
    const enrolled = {};
    if (!fs.existsSync(batchDir)) return enrolled;
    for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
        if (/^person_\d+$/i.test(entry.name)) continue;
        const info = readInfoJson(path.join(batchDir, entry.name));
        if (Array.isArray(info.adaface_mean_embedding) && info.adaface_mean_embedding.length > 0) {
            enrolled[entry.name] = info.adaface_mean_embedding;
        }
    }
    return enrolled;
}

function buildEnrolledEmbeddingsAdafaceTopK(groundTruthDir, batch) {
    const batchDir = path.join(groundTruthDir, batch);
    const enrolled = {};
    if (!fs.existsSync(batchDir)) return enrolled;
    for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
        if (/^person_\d+$/i.test(entry.name)) continue;
        const info = readInfoJson(path.join(batchDir, entry.name));
        if (Array.isArray(info.adaface_top_k_embeddings) && info.adaface_top_k_embeddings.length > 0) {
            enrolled[entry.name] = info.adaface_top_k_embeddings;
        }
    }
    return enrolled;
}

// Mirrors Python's old folder-name parsing: "21CS001_John_Doe" → id="21CS001", name="John Doe"
function parseStudentFolder(folder) {
    const idx = folder.indexOf('_');
    if (idx === -1) return { rollNo: folder, name: folder };
    return { rollNo: folder.slice(0, idx), name: folder.slice(idx + 1).replace(/_/g, ' ') };
}

/**
 * Given the InsightFace subject-embedding output path (under .../ml-data/
 * embeddings/...), derive the parallel AdaFace path under .../ml-data/
 * embeddings_adaface/... — same session/dept/filename structure, sibling
 * root directory (per the "separate folder" requirement).
 */
function toAdafaceOutputPath(outputPath) {
    const parts = outputPath.split(path.sep);
    const idx = parts.lastIndexOf('embeddings');
    if (idx === -1) return null;
    parts[idx] = 'embeddings_adaface';
    return parts.join(path.sep);
}

function writeAdafacePklIfPresent(responseData, outputPath) {
    if (!responseData.adaface_pkl_data) return false;
    const adafaceOutputPath = toAdafaceOutputPath(outputPath);
    if (!adafaceOutputPath) return false;
    fs.mkdirSync(path.dirname(adafaceOutputPath), { recursive: true });
    fs.writeFileSync(adafaceOutputPath, Buffer.from(responseData.adaface_pkl_data, 'base64'));
    return true;
}

/**
 * Build a .pkl for every student subfolder under batchDir and write it to
 * outputPath. Matches the prior /build-embeddings-sync behavior, which
 * always processed every folder in photos_dir (roll_nos was accepted but
 * never actually used as a filter).
 *
 * Also writes a parallel AdaFace .pkl (see toAdafaceOutputPath) whenever
 * the ML service returns adaface_pkl_data — entirely independent of, and
 * never affecting, the InsightFace .pkl above.
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
    const adafaceWritten = writeAdafacePklIfPresent(response.data, outputPath);

    return { status: 'done', students_enrolled, output_path: outputPath, adaface_written: adafaceWritten };
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
    const adafaceWritten = writeAdafacePklIfPresent(response.data, outputPath);

    return { status: 'done', students_enrolled, output_path: outputPath, adaface_written: adafaceWritten };
}

module.exports = {
    updateStudentEmbedding,
    buildBatchEmbeddingsPkl,
    buildEmbeddingsPklForStudents,
    parseStudentFolder,
    buildExistingFoldersPayload,
    buildEnrolledEmbeddings,
    buildEnrolledEmbeddingsTopK,
    buildEnrolledEmbeddingsAdaface,
    buildEnrolledEmbeddingsAdafaceTopK,
};

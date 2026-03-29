// server/src/modules/attendanceModule/controllers/groundTruthController.js

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const axios = require('axios');
const FormData = require('form-data');

// Python ML service base URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

// Helper: human-readable error from axios
function mlError(err) {
    if (err.code === 'ECONNREFUSED') {
        return `Python ML service is not running at ${ML_SERVICE_URL}. Start it with: python ml_service.py`;
    }
    return err.response?.data?.detail || err.message || 'Unknown ML service error';
}

// Ground truth & embeddings directories (at server root level)
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ground_truth');
const EMBEDDINGS_DIR = path.join(__dirname, '..', '..', '..', '..', 'embeddings');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
ensureDir(GROUND_TRUTH_DIR);
ensureDir(EMBEDDINGS_DIR);

class GroundTruthController {

    // ─── List all batch folders ───────────────────────────────────
    async listBatches(req, res) {
        try {
            const entries = await fsPromises.readdir(GROUND_TRUTH_DIR, { withFileTypes: true });
            const batches = [];

            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const batchPath = path.join(GROUND_TRUTH_DIR, entry.name);
                const students = await fsPromises.readdir(batchPath, { withFileTypes: true });
                const studentDirs = students.filter(s => s.isDirectory());

                batches.push({
                    batch: entry.name,
                    studentCount: studentDirs.length
                });
            }
            res.json({ batches });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Create batch folder (DEGREE_DEPT_YEAR) ───────────────────
    async createBatch(req, res) {
        try {
            const { degree, department, year } = req.body;
            if (!degree || !department || !year) {
                return res.status(400).json({ error: 'degree, department, and year are required' });
            }
            const batchName = `${degree}_${department}_${year}`.toUpperCase();
            const batchPath = path.join(GROUND_TRUTH_DIR, batchName);
            ensureDir(batchPath);
            res.json({ batch: batchName, created: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── List students in a batch ─────────────────────────────────
    async listStudents(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const entries = await fsPromises.readdir(batchPath, { withFileTypes: true });
            const students = [];

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                const studentPath = path.join(batchPath, entry.name);
                const files = await fsPromises.readdir(studentPath);
                const allImages = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

                // Read _info.json for embedding/backup split
                const infoPath = path.join(studentPath, '_info.json');
                let embeddingFiles = [];
                let backupFiles    = [];
                let scores         = {};
                if (fs.existsSync(infoPath)) {
                    try {
                        const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                        embeddingFiles = (info.embedding_files || []).filter(f => allImages.includes(f));
                        backupFiles    = (info.backup_files    || []).filter(f => allImages.includes(f));
                        scores         = info.scores || {};
                    } catch (_) {}
                }
                const tracked   = new Set([...embeddingFiles, ...backupFiles]);
                const untracked = allImages.filter(f => !tracked.has(f));

                const makeList = (fnames) => fnames.map(f => ({
                    filename: f,
                    url: `/attendancemodule/ground-truth/photo/${batch}/${entry.name}/${f}`,
                    score: scores[f] || null,
                }));

                students.push({
                    rollNo:         entry.name,
                    photoCount:     allImages.length,
                    embeddingFiles: makeList(embeddingFiles),
                    backupFiles:    makeList(backupFiles),
                    untrackedFiles: makeList(untracked),
                    hasInfo:        embeddingFiles.length > 0 || backupFiles.length > 0,
                    // legacy flat list for backward compat
                    photos: makeList(allImages),
                });
            }
            res.json({ batch, students });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Serve a photo file ───────────────────────────────────────
    async servePhoto(req, res) {
        try {
            const { batch, rollNo, filename } = req.params;
            const filePath = path.join(GROUND_TRUTH_DIR, batch, rollNo, filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Photo not found' });
            }
            res.sendFile(filePath);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Extract faces from video via Python (SSE streaming) ──────
    async extractFaces(req, res) {
        try {
            const { videoLink, batch } = req.body;
            if (!videoLink) {
                return res.status(400).json({ error: 'videoLink is required' });
            }

            let videoPath = videoLink.trim().replace(/^["']+|["']+$/g, '').trim();
            console.log('[extractFaces] videoPath received:', videoPath);

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            // Call Python with axios stream
            const response = await axios.post(
                `${ML_SERVICE_URL}/extract-faces-stream`,
                { videoPath, frame_skip: 5, cluster_threshold: 0.45, min_samples: 2 },
                { responseType: 'stream', timeout: 0 }
            );

            // Pipe Python SSE stream directly to browser
            response.data.pipe(res);
            response.data.on('end', () => res.end());
            response.data.on('error', (err) => {
                res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
                res.end();
            });

        } catch (err) {
            console.error('extractFaces error:', err.code, err.response?.data);
            res.write(`data: ${JSON.stringify({ type: 'error', message: mlError(err) })}\n\n`);
            res.end();
        }
    }

    // ─── Extract + auto-save to serial folders (no roll-no needed) ──
    async extractAndSaveToFolders(req, res) {
        try {
            const {
                videoLink, batch, frameSkip, minImages, detSize, matchThreshold,
                minFaceSize, lapThreshold, topN
            } = req.body;
            if (!videoLink || !batch) {
                return res.status(400).json({ error: 'videoLink and batch required' });
            }

            let videoPath = videoLink.trim().replace(/^["']+|["']+$/g, '').trim();

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const response = await axios.post(
                `${ML_SERVICE_URL}/extract-save-ground-truth`,
                {
                    videoPath,
                    batchName:            batch,
                    frame_skip:           parseInt(frameSkip)      || 5,
                    min_images:           parseInt(minImages)       || 10,
                    det_size:             parseInt(detSize)         || 320,
                    match_threshold:      parseFloat(matchThreshold) || 0.55,
                    min_face_size:        minFaceSize != null ? parseInt(minFaceSize) : 80,
                    laplacian_threshold:  lapThreshold != null ? parseFloat(lapThreshold) : 100.0,
                    top_n:                parseInt(topN)            || 10,
                },
                { responseType: 'stream', timeout: 0 }
            );

            response.data.pipe(res);
            response.data.on('end',   () => res.end());
            response.data.on('error', (err) => {
                res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
                res.end();
            });

        } catch (err) {
            console.error('extractAndSaveToFolders error:', err.code, err.response?.data);
            res.write(`data: ${JSON.stringify({ type: 'error', message: mlError(err) })}\n\n`);
            res.end();
        }
    }

    // ─── Save tagged faces (Page 1 → faces renamed to roll numbers) ──
    async saveTaggedFaces(req, res) {
        try {
            const { batch, faces } = req.body;
            if (!batch || !faces || !Array.isArray(faces)) {
                return res.status(400).json({ error: 'batch and faces array required' });
            }

            const results = [];
            for (const face of faces) {
                const { rollNo, imageData } = face;
                if (!rollNo || !imageData) {
                    results.push({ rollNo: rollNo || 'unknown', status: 'skipped' });
                    continue;
                }

                const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
                ensureDir(studentDir);

                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `face_${Date.now()}_${Math.random().toString(36).slice(2, 5)}.jpg`;
                await fsPromises.writeFile(path.join(studentDir, filename), buffer);

                results.push({ rollNo, filename, status: 'saved' });
            }

            res.json({ batch, results, saved: results.filter(r => r.status === 'saved').length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Save selected best photos (Page 2 → checkbox selection) ──
    async saveSelectedPhotos(req, res) {
        try {
            const { batch, rollNo, selectedPhotos } = req.body;
            if (!batch || !rollNo || !selectedPhotos) {
                return res.status(400).json({ error: 'batch, rollNo, and selectedPhotos required' });
            }

            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            ensureDir(studentDir);

            const results = [];
            for (const photo of selectedPhotos) {
                const base64Data = photo.imageData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `sel_${Date.now()}_${Math.random().toString(36).slice(2, 5)}.jpg`;
                await fsPromises.writeFile(path.join(studentDir, filename), buffer);
                results.push({ filename, status: 'saved' });
            }

            res.json({ batch, rollNo, saved: results.length, results });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Direct photo upload (with ArcFace cropping) ──────────────
    async uploadPhotos(req, res) {
        try {
            const { batch, rollNo } = req.body;
            if (!batch || !rollNo || !req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'batch, rollNo, and photos required' });
            }

            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            ensureDir(studentDir);

            const results = [];
            for (const file of req.files) {
                try {
                    const formData = new FormData();
                    formData.append('image', fs.createReadStream(file.path), file.originalname);

                    const response = await axios.post(
                        `${ML_SERVICE_URL}/crop-face`,
                        formData,
                        { headers: formData.getHeaders(), responseType: 'arraybuffer', timeout: 30000 }
                    );

                    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 5)}.jpg`;
                    await fsPromises.writeFile(path.join(studentDir, filename), response.data);
                    results.push({ original: file.originalname, saved: filename, status: 'success' });
                } catch (err) {
                    results.push({ original: file.originalname, status: 'failed', error: err.message });
                } finally {
                    if (fs.existsSync(file.path)) await fsPromises.unlink(file.path);
                }
            }

            res.json({ batch, rollNo, results, totalStored: results.filter(r => r.status === 'success').length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Delete a student's ground truth ──────────────────────────
    async deleteStudent(req, res) {
        try {
            const { batch, rollNo } = req.params;
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            if (!fs.existsSync(studentDir)) {
                return res.status(404).json({ error: 'Student not found' });
            }
            await fsPromises.rm(studentDir, { recursive: true, force: true });
            res.json({ message: `Removed ground truth for ${rollNo} in ${batch}` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Delete a single photo ────────────────────────────────────
    async deletePhoto(req, res) {
        try {
            const { batch, rollNo, filename } = req.params;
            const filePath = path.join(GROUND_TRUTH_DIR, batch, rollNo, filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Photo not found' });
            }
            await fsPromises.unlink(filePath);
            res.json({ message: `Removed ${filename}` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get student ground truth images with embedding/backup split ──
    async getStudentGroundTruth(req, res) {
        try {
            const { batch, rollNo } = req.params;
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            if (!fs.existsSync(studentDir)) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const files = await fsPromises.readdir(studentDir);
            const allImages = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

            // Read _info.json if present
            const infoPath = path.join(studentDir, '_info.json');
            let embeddingFiles = [];
            let backupFiles    = [];
            let scores         = {};

            if (fs.existsSync(infoPath)) {
                const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                embeddingFiles = (info.embedding_files || []).filter(f => allImages.includes(f));
                backupFiles    = (info.backup_files    || []).filter(f => allImages.includes(f));
                scores         = info.scores || {};
            }

            const tracked    = new Set([...embeddingFiles, ...backupFiles]);
            const untracked  = allImages.filter(f => !tracked.has(f));

            const makePhotoList = (fnames) => fnames.map(f => ({
                filename: f,
                url: `/attendancemodule/ground-truth/photo/${batch}/${rollNo}/${f}`,
                score: scores[f] || null,
            }));

            res.json({
                batch,
                rollNo,
                embeddingFiles: makePhotoList(embeddingFiles),
                backupFiles:    makePhotoList(backupFiles),
                untrackedFiles: makePhotoList(untracked),
                totalImages:    allImages.length,
                hasInfo:        embeddingFiles.length > 0 || backupFiles.length > 0,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Update embedding for a student (manual file selection) ──────
    async updateStudentEmbedding(req, res) {
        try {
            const { batch, rollNo, embeddingFiles } = req.body;
            if (!batch || !rollNo || !Array.isArray(embeddingFiles) || embeddingFiles.length === 0) {
                return res.status(400).json({ error: 'batch, rollNo, and embeddingFiles[] required' });
            }
            const response = await axios.post(
                `${ML_SERVICE_URL}/update-student-embedding`,
                { batch_name: batch, roll_no: rollNo, embedding_files: embeddingFiles },
                { timeout: 60000 }
            );
            res.json(response.data);
        } catch (err) {
            console.error('updateStudentEmbedding error:', err.code, err.response?.data);
            res.status(500).json({ error: mlError(err) });
        }
    }

    // ─── Generate embeddings for a batch ──────────────────────────
    async generateEmbeddings(req, res) {
        try {
            const { batch } = req.body;
            if (!batch) return res.status(400).json({ error: 'batch is required' });

            const response = await axios.post(
                `${ML_SERVICE_URL}/build-embeddings-sync`,
                {
                    photos_dir: path.join(GROUND_TRUTH_DIR, batch),
                    output_path: path.join(EMBEDDINGS_DIR, `${batch}.pkl`)
                },
                { timeout: 180000 }
            );
            res.json(response.data);
        } catch (err) {
            console.error('generateEmbeddings error:', err.code, err.response?.data);
            res.status(500).json({ error: mlError(err) });
        }
    }

    // ─── Run attendance (video + batch → attendance report) ───────
    async runAttendance(req, res) {
        try {
            const { videoLink, batch, room, date, timeSlot, faculty, subject } = req.body;
            if (!videoLink || !batch) {
                return res.status(400).json({ error: 'videoLink and batch are required' });
            }

            const response = await axios.post(
                `${ML_SERVICE_URL}/process-video-with-rolllist`,
                {
                    videoPath: videoLink.trim(),
                    threshold: 0.45,
                    frame_skip: 10,
                    roll_list: [],
                    auto_present_threshold: 0.6,
                    review_threshold: 0.4,
                    min_detections: 3,
                    batch_name: batch,
                    auto_enroll: true,
                    auto_enroll_threshold: 0.6,
                    max_gt_images: 10
                },
                { timeout: 600000 }
            );

            res.json({
                ...response.data,
                metadata: { room, date, timeSlot, faculty, subject, batch }
            });
        } catch (err) {
            console.error('runAttendance error:', err.code, err.response?.data);
            res.status(500).json({ error: mlError(err) });
        }
    }
}

module.exports = GroundTruthController;
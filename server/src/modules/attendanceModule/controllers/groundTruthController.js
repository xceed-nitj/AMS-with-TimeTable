// server/src/modules/attendanceModule/controllers/groundTruthController.js

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const axios = require('axios');
const FormData = require('form-data');

// Python ML service base URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

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
                if (!entry.isDirectory()) continue;
                const studentPath = path.join(batchPath, entry.name);
                const files = await fsPromises.readdir(studentPath);
                const photos = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

                students.push({
                    rollNo: entry.name,
                    photoCount: photos.length,
                    photos: photos.map(p => ({
                        filename: p,
                        url: `/api/attendance/ground-truth/photo/${batch}/${entry.name}/${p}`
                    }))
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

    // ─── Extract faces from video via Python ──────────────────────
    // Sends video link to FastAPI → returns array of unique face crops (base64)
    async extractFaces(req, res) {
        try {
            const { videoLink, batch } = req.body;
            if (!videoLink) {
                return res.status(400).json({ error: 'videoLink is required' });
            }
            const response = await axios.post(
                `${ML_SERVICE_URL}/extract-faces-from-video`,
                { video_url: videoLink, batch },
                { timeout: 300000 }
            );
            res.json(response.data);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            res.status(500).json({ error: msg });
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

    // ─── Generate embeddings for a batch ──────────────────────────
    async generateEmbeddings(req, res) {
        try {
            const { batch } = req.body;
            if (!batch) return res.status(400).json({ error: 'batch is required' });

            const response = await axios.post(
                `${ML_SERVICE_URL}/generate-embeddings`,
                { batch, ground_truth_dir: GROUND_TRUTH_DIR },
                { timeout: 180000 }
            );
            res.json(response.data);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            res.status(500).json({ error: msg });
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
                `${ML_SERVICE_URL}/run-attendance`,
                { video_url: videoLink, batch, embeddings_dir: EMBEDDINGS_DIR },
                { timeout: 600000 }
            );

            res.json({
                ...response.data,
                metadata: { room, date, timeSlot, faculty, subject, batch }
            });
        } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            res.status(500).json({ error: msg });
        }
    }
}

module.exports = GroundTruthController;
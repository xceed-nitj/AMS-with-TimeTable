// server/src/modules/attendanceModule/routes/groundTruthRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const GroundTruthController = require('../controllers/groundTruthController');
const TimeTable = require('../../../models/timetable');

const controller = new GroundTruthController();

// Multer for direct photo uploads
const upload = multer({
    dest: path.join(__dirname, '..', '..', '..', '..', 'temp_uploads'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    }
});

// ─── Ground Truth Management ──────────────────────────────────────

// ─── Fetch departments from timetable/addsem routes ─────────────────
// Returns list of { dept, session, code } from TimeTable collection
// Used by ground truth generation page so batch folder names always match
router.get('/departments', async (req, res) => {
    try {
        const timetables = await TimeTable.find({}, 'dept session code currentSession').lean();
        // Deduplicate by dept (case-insensitive)
        const seen = new Set();
        const depts = [];
        for (const tt of timetables) {
            const key = (tt.dept || '').toUpperCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                depts.push({ dept: tt.dept, session: tt.session, code: tt.code, currentSession: tt.currentSession });
            }
        }
        res.json({ departments: depts });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// List all batches
router.get('/batches', async (req, res) => {
    try { await controller.listBatches(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Create a new batch folder
router.post('/create-batch', async (req, res) => {
    try { await controller.createBatch(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// List students in a batch
router.get('/batches/:batch/students', async (req, res) => {
    try { await controller.listStudents(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Serve a photo
router.get('/photo/:batch/:rollNo/:filename', async (req, res) => {
    try { await controller.servePhoto(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Face Extraction from Video (Page 1) ──────────────────────────

// NEW: Extract + auto-save to person_001/… folders (no roll-no needed)
router.post('/extract-and-save', async (req, res) => {
    try { await controller.extractAndSaveToFolders(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Extract faces from video link (legacy — returns base64 to browser)
router.post('/extract-faces', async (req, res) => {
    try { await controller.extractFaces(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Save tagged faces (face → roll number mapping)
router.post('/save-tagged-faces', async (req, res) => {
    try { await controller.saveTaggedFaces(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Photo Selection & Upload (Page 2) ────────────────────────────

// Save selected best photos
router.post('/save-selected-photos', async (req, res) => {
    try { await controller.saveSelectedPhotos(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Direct photo upload with face cropping
router.post('/upload-photos', upload.array('photos', 10), async (req, res) => {
    try { await controller.uploadPhotos(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Edit & Delete (Page 3) ───────────────────────────────────────

router.delete('/student/:batch/:rollNo', async (req, res) => {
    try { await controller.deleteStudent(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/photo/:batch/:rollNo/:filename', async (req, res) => {
    try { await controller.deletePhoto(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Ground Truth Images & Embedding Management ───────────────────

// Get student images split into embedding / backup / untracked
router.get('/student-ground-truth/:batch/:rollNo', async (req, res) => {
    try { await controller.getStudentGroundTruth(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Rebuild embedding from manually selected files
router.post('/update-embedding', async (req, res) => {
    try { await controller.updateStudentEmbedding(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Embeddings & Attendance (Page 4) ─────────────────────────────

router.post('/generate-embeddings', async (req, res) => {
    try { await controller.generateEmbeddings(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/run-attendance', async (req, res) => {
    try { await controller.runAttendance(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});



// ─── Live RTSP Ground Truth (SSE streaming) ───────────────────────

const http = require('http');

router.post('/extract-rtsp-stream', (req, res) => {
    const body = JSON.stringify(req.body);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const options = {
        hostname: '127.0.0.1',
        port: 8500,
        path: '/extract-rtsp-stream',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        },
    };

    const proxy = http.request(options, (mlRes) => {
        mlRes.on('data', (chunk) => {
            if (!res.writableEnded) res.write(chunk);
        });

        mlRes.on('end', () => {
            if (!res.writableEnded) res.end();
        });

        mlRes.on('error', (err) => {
            console.error('ML stream error:', err.message);
            if (!res.writableEnded) res.end();
        });
    });

    proxy.on('error', (err) => {
        console.error('RTSP proxy error:', err.message);
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'ML service unavailable' })}\n\n`);
            res.end();
        }
    });

    // Only destroy proxy when response is closed, not request
    res.on('close', () => {
        console.log('Response closed — aborting ML stream');
        proxy.destroy();
    });

    proxy.write(body);
    proxy.end();
});

router.post('/stop-rtsp-stream', (req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: 8500,
        path: '/stop-rtsp-stream',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    const proxy = http.request(options, (mlRes) => {
        let data = '';
        mlRes.on('data', chunk => data += chunk);
        mlRes.on('end', () => {
            try { res.json(JSON.parse(data)); }
            catch { res.json({ status: 'ok' }); }
        });
    });

    proxy.on('error', (err) => {
        console.error('Stop proxy error:', err.message);
        res.status(502).json({ error: 'ML service unavailable' });
    });

    proxy.end();
});

router.get('/rtsp-preview', (req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: 8500,
        path: '/rtsp-preview',
        method: 'GET',
    };
    const proxy = http.request(options, (mlRes) => {
        res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
        res.setHeader('Cache-Control', 'no-cache');
        mlRes.pipe(res);
    });
    proxy.on('error', (err) => {
        res.status(502).end();
    });
    res.on('close', () => proxy.destroy());
    proxy.end();
});

module.exports = router;

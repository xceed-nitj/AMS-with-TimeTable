// server/src/modules/attendanceModule/routes/groundTruthRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const GroundTruthController = require('../controllers/groundTruthController');
const TimeTable = require('../../../models/timetable');

const controller = new GroundTruthController();


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

// ─── Edit & Delete ────────────────────────────────────────────────

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

// Approve new photos for a student (adds to approved_files + embedding)
router.post('/approve-photos', async (req, res) => {
    try { await controller.approvePhotos(req, res); }
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
const fs   = require('fs');

const GT_BASE_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

// Internal SSE event types that Node.js handles server-side (not forwarded to client)
const GT_INTERNAL = new Set(['mkdir_batch', 'mkdir', 'crop_save', 'info_save', 'file_delete']);

function handleGroundTruthEvent(event, batch) {
    const batchDir = path.join(GT_BASE_DIR, batch);
    try {
        if (event.type === 'mkdir_batch') {
            fs.mkdirSync(batchDir, { recursive: true });

        } else if (event.type === 'mkdir') {
            fs.mkdirSync(path.join(batchDir, event.folder), { recursive: true });

        } else if (event.type === 'crop_save') {
            const folderPath = path.join(batchDir, event.folder);
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(path.join(folderPath, event.filename), Buffer.from(event.data, 'base64'));

        } else if (event.type === 'info_save') {
            const folderPath = path.join(batchDir, event.folder);
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(path.join(folderPath, '_info.json'), JSON.stringify(event.info, null, 2));

        } else if (event.type === 'file_delete') {
            const filePath = path.join(batchDir, event.folder, event.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`[GT] Error handling ${event.type} for ${batch}/${event.folder || ''}:`, err.message);
    }
}

router.post('/extract-rtsp-stream', (req, res) => {
    const body  = JSON.stringify(req.body);
    const batch = req.body.batch || '';

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
        let buffer = '';

        mlRes.on('data', (chunk) => {
            buffer += chunk.toString();

            // Process complete SSE events (each terminated by \n\n)
            let boundary;
            while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                const eventText = buffer.substring(0, boundary + 2);
                buffer = buffer.substring(boundary + 2);

                const dataLine = eventText.trimEnd();
                if (!dataLine.startsWith('data: ')) {
                    if (!res.writableEnded) res.write(eventText);
                    continue;
                }

                let event = null;
                try { event = JSON.parse(dataLine.slice(6)); } catch {}

                if (event && GT_INTERNAL.has(event.type)) {
                    handleGroundTruthEvent(event, batch);
                } else {
                    if (!res.writableEnded) res.write(eventText);
                }
            }
        });

        mlRes.on('end', () => {
            if (buffer && !res.writableEnded) res.write(buffer);
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

router.post('/start-preview', (req, res) => {
    const body = JSON.stringify(req.body);
    const options = {
        hostname: '127.0.0.1',
        port: 8500,
        path: '/start-preview',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        },
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
        console.error('start-preview proxy error:', err.message);
        res.status(502).json({ error: 'ML service unavailable' });
    });
    proxy.write(body);
    proxy.end();
});

module.exports = router;

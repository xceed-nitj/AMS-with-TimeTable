// server/src/modules/attendanceModule/routes/groundTruthRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const GroundTruthController = require('../controllers/groundTruthController');
const TimeTable = require('../../../models/timetable');
const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');

const controller = new GroundTruthController();


// ─── Ground Truth Management ──────────────────────────────────────

// ─── Fetch departments from timetable/addsem routes ─────────────────
// Returns list of { dept, session, code } from TimeTable collection
// Used by ground truth generation page so batch folder names always match
router.get('/departments', async (req, res) => {
    try {
        const timetableFilter = req.attendanceFullAccess
            ? {}
            : { dept: { $regex: new RegExp(`^${req.attendanceDepartment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };
        const timetables = await TimeTable.find(timetableFilter, 'dept session code currentSession').lean();
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

// Ground truth dashboard stats (aggregated from ClusterMatch)
router.get('/stats', async (req, res) => {
    try {
        const match = req.attendanceFullAccess
            ? {}
            : { batch: { $regex: new RegExp(`^[^_]+_${req.attendanceDepartment.trim().replace(/[\s-]+/g, '_').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_`, 'i') } };
        const agg = await ClusterMatch.aggregate([{ $match: match }, { $facet: {
            total:     [{ $count: 'n' }],
            approved:  [{ $match: { status: 'approved' } }, { $count: 'n' }],
            matched:   [{ $match: { status: { $in: ['matched', 'approved'] } } }, { $count: 'n' }],
            withEmb:   [{ $match: { 'embeddingFiles.0': { $exists: true } } }, { $count: 'n' }],
            imgSum:    [{ $group: { _id: null, total: { $sum: '$imageCount' } } }],
        }}]);
        const f = agg[0];
        res.json({
            totalClusters: f.total[0]?.n    ?? 0,
            approved:      f.approved[0]?.n  ?? 0,
            matched:       f.matched[0]?.n   ?? 0,
            withEmbedding: f.withEmb[0]?.n   ?? 0,
            totalImages:   f.imgSum[0]?.total ?? 0,
        });
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

const axios = require('axios');
const fs    = require('fs');
const { buildExistingFoldersPayload } = require('../controllers/embeddingSyncHelper');
const { checkGroundTruthAllowed } = require('../controllers/timeWindowGuard');

// The ML service may run on a separate machine (e.g. the H100 GPU box) —
// always resolve it from ML_SERVICE_URL, same as every other integration
// point (mlServiceClient.js, mlRoutes.js, cameraController.js, etc.).
// Previously these routes hardcoded hostname/port to 127.0.0.1:8500, which
// silently ignored ML_SERVICE_URL and broke as soon as the service moved
// off the Node host.
const rawMlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const ML_SERVICE_URL = /^https?:\/\//i.test(rawMlUrl) ? rawMlUrl : `http://${rawMlUrl}`;

const GT_BASE_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

// Internal SSE event types that Node.js handles server-side (not forwarded to client)
const GT_INTERNAL = new Set(['mkdir_batch', 'mkdir', 'crop_save', 'info_save', 'file_delete']);

// pythonFolderMap: maps Python-assigned "person_XXX" label → MongoDB ObjectId string
// scoped per SSE request so parallel streams never collide
function handleGroundTruthEvent(event, batch, pythonFolderMap) {
    const batchDir = path.join(GT_BASE_DIR, batch);
    try {
        if (event.type === 'mkdir_batch') {
            fs.mkdirSync(batchDir, { recursive: true });

        } else if (event.type === 'mkdir') {
            // Create the folder on disk (name stays person_XXX)
            fs.mkdirSync(path.join(batchDir, event.folder), { recursive: true });

            // Generate a stable ObjectId for this cluster immediately
            const oid    = new mongoose.Types.ObjectId();
            const oidStr = oid.toString();
            pythonFolderMap[event.folder] = oidStr;

            // Persist ClusterMatch record so the _id exists before ERP matching
            ClusterMatch.create({
                _id:           oid,
                batch,
                folderName:    event.folder,   // e.g. "person_001" — immutable label
                currentFolder: event.folder,   // tracks actual disk folder; updated on approval
                status:        'unmatched',
                imageFiles:    [],
                imageCount:    0,
            }).catch(err => {
                // Duplicate key = folder already registered (re-run / restart), safe to ignore
                if (err.code !== 11000)
                    console.error('[GT] ClusterMatch create error:', err.message);
            });

        } else if (event.type === 'crop_save') {
            const folderPath = path.join(batchDir, event.folder);
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(path.join(folderPath, event.filename), Buffer.from(event.data, 'base64'));

            // Update imageFiles list on the ClusterMatch record
            const oidStr = pythonFolderMap[event.folder];
            if (oidStr) {
                ClusterMatch.findByIdAndUpdate(oidStr, {
                    $addToSet: { imageFiles:    event.filename },
                    $inc:      { imageCount:    1 },
                }).catch(() => {});
            }

        } else if (event.type === 'info_save') {
            const folderPath = path.join(batchDir, event.folder);
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(path.join(folderPath, '_info.json'), JSON.stringify(event.info, null, 2));

            // Sync embeddingFiles / previewFiles to DB from the info payload
            const oidStr = pythonFolderMap[event.folder];
            if (oidStr && event.info) {
                const embeds  = event.info.embedding_files || [];
                const backups = event.info.backup_files    || [];
                const all     = [...embeds, ...backups];
                ClusterMatch.findByIdAndUpdate(oidStr, {
                    $set: {
                        embeddingFiles: embeds,
                        previewFiles:   all.slice(0, 6),
                    },
                }).catch(() => {});
            }

        } else if (event.type === 'file_delete') {
            const filePath = path.join(batchDir, event.folder, event.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`[GT] Error handling ${event.type} for ${batch}/${event.folder || ''}:`, err.message);
    }
}

router.post('/extract-rtsp-stream', async (req, res) => {
    // Optional 08:30–17:30 IST restriction (admin toggle, default off).
    const gate = await checkGroundTruthAllowed();
    if (!gate.allowed) {
        return res.status(403).json({ error: gate.reason });
    }

    const batch           = req.body.batch || '';
    const existingFolders = buildExistingFoldersPayload(path.join(GT_BASE_DIR, batch));
    const body            = { ...req.body, existingFolders };
    const pythonFolderMap = {};   // person_XXX → ObjectId string, scoped to this stream

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let proxyRes;
    try {
        proxyRes = await axios.post(`${ML_SERVICE_URL}/extract-rtsp-stream`, body, {
            responseType: 'stream',
            timeout: 0,   // long-lived stream — runs until the client stops it
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('RTSP proxy error:', err.message);
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'ML service unavailable' })}\n\n`);
            res.end();
        }
        return;
    }

    let buffer = '';

    proxyRes.data.on('data', (chunk) => {
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
                handleGroundTruthEvent(event, batch, pythonFolderMap);
            } else {
                if (!res.writableEnded) res.write(eventText);
            }
        }
    });

    proxyRes.data.on('end', () => {
        if (buffer && !res.writableEnded) res.write(buffer);
        if (!res.writableEnded) res.end();
    });

    proxyRes.data.on('error', (err) => {
        console.error('ML stream error:', err.message);
        if (!res.writableEnded) res.end();
    });

    // Only destroy the upstream stream when the response is closed
    res.on('close', () => {
        console.log('Response closed — aborting ML stream');
        proxyRes.data.destroy();
    });
});

router.post('/stop-rtsp-stream', async (req, res) => {
    try {
        const result = await axios.post(`${ML_SERVICE_URL}/stop-rtsp-stream`, req.body || {}, { timeout: 10000 });
        res.json(result.data);
    } catch (err) {
        console.error('Stop proxy error:', err.message);
        res.status(502).json({ error: 'ML service unavailable' });
    }
});

router.get('/rtsp-preview', async (req, res) => {
    const jobId = req.query.jobId;
    try {
        const result = await axios.get(`${ML_SERVICE_URL}/rtsp-preview`, {
            params: jobId ? { jobId } : undefined,
            responseType: 'stream',
            timeout: 0,   // long-lived MJPEG stream
        });
        res.setHeader('Content-Type', result.headers['content-type'] || 'multipart/x-mixed-replace; boundary=frame');
        res.setHeader('Cache-Control', 'no-cache');
        result.data.pipe(res);
        result.data.on('error', () => { if (!res.writableEnded) res.end(); });
        req.on('close', () => result.data.destroy());
    } catch (err) {
        if (!res.writableEnded) res.status(502).end();
    }
});

router.post('/start-preview', async (req, res) => {
    try {
        const result = await axios.post(`${ML_SERVICE_URL}/start-preview`, req.body, { timeout: 15000 });
        res.json(result.data);
    } catch (err) {
        console.error('start-preview proxy error:', err.message);
        res.status(502).json({ error: 'ML service unavailable' });
    }
});

module.exports = router;
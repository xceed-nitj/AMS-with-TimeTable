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

// The disk writer and the set of internally-handled SSE event types now live
// in the acquisition manager, shared between the legacy browser-driven
// /extract-rtsp-stream path (below) and the server-persistent gt-acquisition/*
// jobs — so both write ground-truth files identically.
const gtManager = require('../controllers/gtAcquisitionManager');
const { handleGroundTruthEvent, GT_INTERNAL } = gtManager;
const getUserDetails = require('../../usermanagement/controllers/dto');

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
        // Must hit the ML service's /gt-acquisition-preview, not /rtsp-preview —
        // that path is a *different* preview system (Camera Live Preview,
        // ground_truth_routes.py's own _previews dict) which happens to shadow
        // this module's route since it's registered first in ml_service.py.
        // This jobId only exists in rtsp_routes.py's _jobs registry, so hitting
        // the shadowed /rtsp-preview always 404/503'd against the wrong dict.
        const result = await axios.get(`${ML_SERVICE_URL}/gt-acquisition-preview`, {
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

// ─── Server-persistent Ground Truth acquisition (gtAcquisitionManager) ────────
// Unlike /extract-rtsp-stream (which dies when the browser tab closes), these
// jobs run on the server until Stop or the 60-minute ceiling. The browser
// starts a job, attaches to observe it, and can reattach after a reload.

async function resolveStartedByName(req) {
    if (req.user?.email) return req.user.email;
    try {
        const u = await getUserDetails(req.user.id);
        return u?.email || String(req.user.id);
    } catch (_) {
        return String(req.user?.id || 'user');
    }
}

// Start a job. `enforceAttendanceDepartment` (mounted on /ground-truth) already
// rejects a batch outside the caller's department, so no extra check needed.
router.post('/gt-acquisition/start', async (req, res) => {
    const gate = await checkGroundTruthAllowed();
    if (!gate.allowed) return res.status(403).json({ error: gate.reason });

    const {
        mode = 'single', batch, cameras,
        detSize, frameSkip, targetImgsPerPerson, minSamples, clusterThreshold,
    } = req.body || {};

    if (!batch) return res.status(400).json({ error: 'batch is required' });
    if (!Array.isArray(cameras) || cameras.length === 0)
        return res.status(400).json({ error: 'cameras[] is required' });
    if (!cameras.every(c => c && c.url))
        return res.status(400).json({ error: 'every camera needs a url' });

    const { acquisitionId } = gtManager.startAcquisition({
        mode,
        batch,
        cameras,
        // Omitted values stay undefined (dropped from the JSON body) so the
        // ML service seeds them from the GT Acquisition config (ML Fine
        // Tuning page) and reports the fallback via a gt_config_seeded event.
        params: {
            detSize:             Number(detSize)             || undefined,
            frameSkip:           Number(frameSkip)           || undefined,
            targetImgsPerPerson: Number(targetImgsPerPerson) || undefined,
            minSamples:          Number(minSamples)          || undefined,
            clusterThreshold:    Number(clusterThreshold)    || undefined,
        },
        startedByName: await resolveStartedByName(req),
        department:    req.attendanceDepartment,
    });

    res.json({ acquisitionId });
});

// List running/recent jobs the caller may see — used on page load to show
// active acquisitions (elapsed time + per-person counts) and reattach.
router.get('/gt-acquisition/status', (req, res) => {
    res.json({
        jobs: gtManager.listJobs({
            department:  req.attendanceDepartment,
            fullAccess:  req.attendanceFullAccess,
        }),
    });
});

// Live SSE feed for one job: emits a `snapshot` immediately, then streams
// updates. Detaching (tab close/reload) never affects the job.
router.get('/gt-acquisition/stream', (req, res) => {
    const { acquisitionId } = req.query;
    if (!acquisitionId) return res.status(400).json({ error: 'acquisitionId is required' });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    gtManager.attachStream(acquisitionId, res);
});

router.post('/gt-acquisition/stop', async (req, res) => {
    const { acquisitionId } = req.body || {};
    if (!acquisitionId) return res.status(400).json({ error: 'acquisitionId is required' });
    const result = await gtManager.stopAcquisition(acquisitionId);
    if (!result.ok) return res.status(404).json(result);
    res.json(result);
});

module.exports = router;
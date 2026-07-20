// server/src/modules/attendanceModule/routes/groundTruthUploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const GroundTruthUploadController = require('../controllers/groundTruthUploadController');
const axios = require('axios'); // for proxying to ML service

const controller = new GroundTruthUploadController();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8500';

// ─── Multer with strict limits ────────────────────────────────────────────────
// Fixes: CRITICAL-4 (no file size limit / memory exhaustion DoS)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,  // 50 MB max per file
        files: 1,                     // single file only
    },
});

// ─── Error handler for Multer limit errors ────────────────────────────────────
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────



// Upload batch ZIP
// Fixes: CRITICAL-4 (Multer limits applied)
router.post('/upload-zip/:batch',
    upload.single('zipFile'),
    handleMulterError,
    async (req, res) => {
        try {
            await controller.uploadBatchZip(req, res);
        } catch (e) {
            console.error('[GT Upload Route] uploadBatchZip error:', e);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Upload individual student photo
// Fixes: HIGH-5 (changed upload.array to upload.single, matching actual 1-photo behavior)
router.post('/upload-photos/:batch/:rollNo',
    upload.single('photo'),
    handleMulterError,
    async (req, res) => {
        try {
            await controller.uploadStudentPhoto(req, res);
        } catch (e) {
            console.error('[GT Upload Route] uploadStudentPhoto error:', e);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Rename student folder
router.patch('/rename-student', async (req, res) => {
    try {
        await controller.renameStudent(req, res);
    } catch (e) {
        console.error('[GT Upload Route] renameStudent error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete student photo
router.delete('/photo/:batch/:rollNo', async (req, res) => {
    try {
        await controller.deletePhoto(req, res);
    } catch (e) {
        console.error('[GT Upload Route] deletePhoto error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete ALL photos in a batch
router.delete('/photos/:batch', async (req, res) => {
    try {
        await controller.deleteAllPhotos(req, res);
    } catch (e) {
        console.error('[GT Upload Route] deleteAllPhotos error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List photos (roll numbers) in a batch
router.get('/list/:batch', async (req, res) => {
    try { await controller.listPhotos(req, res); }
    catch (e) { res.status(500).json({ error: 'Internal server error' }); }
});

// Summary of all ERP photo batches
router.get('/summary', async (req, res) => {
    try { await controller.listAllBatches(req, res); }
    catch (e) { res.status(500).json({ error: 'Internal server error' }); }
});

// Fast filesystem check — does the ERP pkl exist for this batch?
router.get('/embedding-ready/:batch', async (req, res) => {
    try { await controller.checkEmbedding(req, res); }
    catch (e) { res.status(500).json({ error: 'Check failed' }); }
});

// Get ERP embedding sync status
router.get('/status/:batch', async (req, res) => {
    try {
        await controller.getStatus(req, res);
    } catch (e) {
        console.error('[GT Upload Route] status error:', e.message);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// Trigger sync-all
router.post('/sync-all/:batch', async (req, res) => {
    try {
        await controller.syncAll(req, res);
    } catch (e) {
        console.error('[GT Upload Route] sync-all proxy error:', e.message);
        res.status(502).json({ error: 'Failed to trigger sync-all on ML service' });
    }
});

module.exports = router;

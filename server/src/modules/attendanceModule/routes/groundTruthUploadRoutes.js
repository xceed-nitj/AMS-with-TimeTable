// server/src/modules/attendanceModule/routes/groundTruthUploadRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const GroundTruthUploadController = require('../controllers/groundTruthUploadController');

const controller = new GroundTruthUploadController();

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

module.exports = router;

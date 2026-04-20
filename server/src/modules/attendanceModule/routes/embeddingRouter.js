// server/src/modules/attendanceModule/routes/embeddingRoutes.js
const express = require('express');
const router  = express.Router();
const EmbeddingController = require('../controllers/embeddingController');

const ctrl = new EmbeddingController();

// GET  /attendancemodule/embeddings/status/:batch
// Legacy: history by batch name
router.get('/status/:batch', async (req, res) => {
    try { await ctrl.getStatus(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// GET  /attendancemodule/embeddings/status-by-file/:fileBase
// New: history by embedding file base (e.g. "6_Digital_Electronics")
router.get('/status-by-file/:fileBase', async (req, res) => {
    try { await ctrl.getStatusByFile(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /attendancemodule/embeddings/generate
router.post('/generate', async (req, res) => {
    try { await ctrl.generate(req, res); }
    catch (e) {
        // SSE stream may already be open — don't call res.json() as it will crash the stream
        if (!res.headersSent) {
            res.status(500).json({ error: e.message });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}

`);
            res.end();
        }
    }
});
// GET  /attendancemodule/embeddings/list-files
router.get('/list-files', async (req, res) => {
    try { await ctrl.listFiles(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /attendancemodule/embeddings/upload-pkl  (multipart)
router.post('/upload-pkl', ctrl.uploadPkl());

// DELETE /attendancemodule/embeddings/:id
router.delete('/:id', async (req, res) => {
    try { await ctrl.deleteRecord(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

// server/src/modules/attendanceModule/routes/embeddingRoutes.js
const express = require('express');
const router  = express.Router();
const EmbeddingController = require('../controllers/embeddingController');

const ctrl = new EmbeddingController();

// GET  /attendancemodule/embeddings/enrolled-roll-nos/:sem/:dept
// Returns roll nos enrolled for a sem+dept (used by frontend before generating embeddings)
router.get('/enrolled-roll-nos/:sem/:dept', async (req, res) => {
    try { await ctrl.getEnrolledRollNos(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// GET  /attendancemodule/embeddings/enrolled-roll-nos/:sem  (no dept filter)
router.get('/enrolled-roll-nos/:sem', async (req, res) => {
    req.params.dept = 'ALL';
    try { await ctrl.getEnrolledRollNos(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// GET  /attendancemodule/embeddings/resolve-file/:sem/:subject
// Tells frontend which .pkl will be used for a subject (subject-specific or fallback)
router.get('/resolve-file/:sem/:subject', async (req, res) => {
    try { await ctrl.resolveFile(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

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

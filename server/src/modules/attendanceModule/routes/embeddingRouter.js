// server/src/modules/attendanceModule/routes/embeddingRoutes.js
const express = require('express');
const router  = express.Router();
const EmbeddingController = require('../controllers/embeddingController');

const ctrl = new EmbeddingController();

// GET  /attendancemodule/embeddings/status/:batch
router.get('/status/:batch', async (req, res) => {
    try { await ctrl.getStatus(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /attendancemodule/embeddings/generate
router.post('/generate', async (req, res) => {
    try { await ctrl.generate(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /attendancemodule/embeddings/:id
router.delete('/:id', async (req, res) => {
    try { await ctrl.deleteRecord(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
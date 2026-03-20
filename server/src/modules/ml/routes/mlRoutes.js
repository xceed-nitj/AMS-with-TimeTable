const express = require('express');
const router = express.Router();
const mlClient = require('../controllers/mlServiceClient');
const { processVideoFile } = require('../controllers/videoWatcher');

router.get('/health', async (req, res) => {
    try {
        res.json(await mlClient.healthCheck());
    } catch (e) {
        res.status(503).json({ status: 'unreachable' });
    }
});

router.post('/process-video', async (req, res) => {
    const { videoPath } = req.body;
    if (!videoPath) return res.status(400).json({ error: 'videoPath required' });
    try {
        res.json(await processVideoFile(videoPath));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/reload-embeddings', async (req, res) => {
    try {
        res.json(await mlClient.reloadEmbeddings());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
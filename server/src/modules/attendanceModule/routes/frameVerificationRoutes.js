const express = require('express');
const router = express.Router();
const FrameVerificationController = require('../controllers/frameVerificationController');

const ctrl = new FrameVerificationController();

router.get('/availability', async (req, res) => {
    try { await ctrl.getAvailability(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/frames', async (req, res) => {
    try { await ctrl.getFrames(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/image/:type/:folder/:filename', async (req, res) => {
    try { await ctrl.serveImage(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

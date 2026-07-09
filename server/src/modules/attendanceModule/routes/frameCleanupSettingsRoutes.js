const express = require('express');
const router = express.Router();
const FrameCleanupSettingsController = require('../controllers/frameCleanupSettingsController');
const controller = new FrameCleanupSettingsController();

router.get('/', async (req, res) => await controller.getSettings(req, res));
router.put('/', async (req, res) => await controller.updateEnabled(req, res));
router.post('/run-now', async (req, res) => await controller.runNow(req, res));

module.exports = router;

const express = require('express');
const router = express.Router();
const OtherControlsSettingsController = require('../controllers/otherControlsSettingsController');
const controller = new OtherControlsSettingsController();

router.get('/', async (req, res) => await controller.getSettings(req, res));
router.put('/', async (req, res) => await controller.updateSettings(req, res));

module.exports = router;

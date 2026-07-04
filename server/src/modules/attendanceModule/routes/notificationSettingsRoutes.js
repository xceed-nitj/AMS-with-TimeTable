const express = require('express');
const router = express.Router();
const NotificationSettingsController = require('../controllers/notificationSettingsController');
const controller = new NotificationSettingsController();

router.get('/', async (req, res) => await controller.getSettings(req, res));
router.put('/', async (req, res) => await controller.updateEnabled(req, res));
router.put('/roles/:role', async (req, res) => await controller.updateRoleAlertTypes(req, res));
router.put('/daily-summary', async (req, res) => await controller.updateDailySummaryConfig(req, res));
router.post('/recipients', async (req, res) => await controller.addRecipient(req, res));
router.delete('/recipients/:id', async (req, res) => await controller.removeRecipient(req, res));

module.exports = router;

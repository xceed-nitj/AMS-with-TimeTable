const express = require('express');
const router = express.Router();
const BatchSettingsController = require('../controllers/batchSettingsController');
const { attendanceRoleAccess } = require('../middleware/attendanceAccess');

const controller = new BatchSettingsController();

router.get('/', async (req, res) => await controller.listBatches(req, res));
router.get('/department/:dept', async (req, res) => await controller.listBatches(req, res));
router.post('/', async (req, res) => await controller.createBatch(req, res));
router.put('/:id', async (req, res) => await controller.updateBatch(req, res));
router.delete('/:id', async (req, res) => await controller.deleteBatch(req, res));

module.exports = router;

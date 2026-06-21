const express = require('express');
const router = express.Router();
const BatchSettingsController = require('../controllers/batchSettingsController');
const { attendanceRoleAccess } = require('../middleware/attendanceAccess');

const controller = new BatchSettingsController();

// Literal routes must come BEFORE '/:id' — otherwise Express treats
// "dept-menus" as an :id value and routes it into updateBatch/deleteBatch.
router.get('/dept-menus', async (req, res) => await controller.getDeptMenus(req, res));
router.put('/dept-menus', async (req, res) => await controller.updateDeptMenus(req, res));

router.get('/', async (req, res) => await controller.listBatches(req, res));
router.get('/department/:dept', async (req, res) => await controller.listBatches(req, res));
router.post('/', async (req, res) => await controller.createBatch(req, res));
router.put('/:id', async (req, res) => await controller.updateBatch(req, res));
router.delete('/:id', async (req, res) => await controller.deleteBatch(req, res));

module.exports = router;
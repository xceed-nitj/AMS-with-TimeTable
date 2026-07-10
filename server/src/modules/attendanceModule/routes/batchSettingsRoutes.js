const express = require('express');
const router = express.Router();
const BatchSettingsController = require('../controllers/batchSettingsController');
const { attendanceRoleAccess } = require('../middleware/attendanceAccess');
const { checkRole } = require('../../checkRole.middleware');

const controller = new BatchSettingsController();

// Router mount (index.js) already requires admin/iams-admin/iams-dept-admin,
// but these particular routes have institute-wide effect (deptMenus applies
// to every department via updateMany, and any batch id is editable by any
// dept-admin since Batch records aren't department-scoped) — restrict them
// to admin/iams-admin only, same pattern as ML process control.
const adminOnly = checkRole(['iams-admin']);

// Literal routes must come BEFORE '/:id' — otherwise Express treats
// "dept-menus" as an :id value and routes it into updateBatch/deleteBatch.
router.get('/dept-menus', async (req, res) => await controller.getDeptMenus(req, res));
router.put('/dept-menus', adminOnly, async (req, res) => await controller.updateDeptMenus(req, res));

// Degree array endpoints — must come BEFORE '/:id'
router.get('/:id/degrees', async (req, res) => await controller.getDegrees(req, res));
router.put('/:id/degrees', async (req, res) => await controller.updateDegrees(req, res));
router.get('/degrees', async (req, res) => await controller.getGlobalDegrees(req, res));
router.put('/degrees', adminOnly, async (req, res) => await controller.updateAllDegrees(req, res));

router.get('/', async (req, res) => await controller.listBatches(req, res));
router.get('/department/:dept', async (req, res) => await controller.listBatches(req, res));
router.post('/', async (req, res) => await controller.createBatch(req, res));
router.put('/:id', adminOnly, async (req, res) => await controller.updateBatch(req, res));
router.delete('/:id', adminOnly, async (req, res) => await controller.deleteBatch(req, res));

module.exports = router;
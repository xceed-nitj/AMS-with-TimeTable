// server/src/modules/attendanceModule/routes/schedulerRoutes.js

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/schedulerController');

router.post('/run-all', ctrl.runAll);
router.get('/preview', ctrl.preview);
router.get('/live-status', ctrl.liveStatus);

module.exports = router;
// server/src/modules/attendanceModule/routes/erpPushRoutes.js
// Status/settings for the outbound ERP attendance push — see
// erpAttendancePushController.js. Mounted under /erp-push in routes/index.js.

const express = require('express');
const router  = express.Router();
const {
    getSettings, updateSettings, getPushStatus, retryOne, syncAll,
} = require('../controllers/erpAttendancePushController');

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/status', getPushStatus);
router.post('/sync-all', syncAll);
router.post('/:reportId/retry', retryOne);

module.exports = router;

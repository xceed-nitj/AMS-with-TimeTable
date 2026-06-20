// server/src/modules/attendanceModule/routes/acquisitionControlRoutes.js

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/acquisitionControlController');

router.get('/',                          ctrl.getConfig);
router.patch('/',                        ctrl.updateGlobal);
router.patch('/period/:periodKey',       ctrl.updatePeriod);
router.post('/stop-day',                 ctrl.stopDay);
router.delete('/stop-day/:date',         ctrl.resumeDay);
router.post('/rooms',                    ctrl.upsertRoom);
router.delete('/rooms/:room',            ctrl.removeRoom);
router.post('/extra-class',              ctrl.addExtraClass);
router.patch('/extra-class/:id',         ctrl.updateExtraClass);
router.delete('/extra-class/:id',        ctrl.deleteExtraClass);

module.exports = router;
const express = require("express");
const router  = express.Router();
const acquisitionControlRoutes = require('./acquisitionControlRoutes');

const {
    attendanceRoleAccess,
    enforceAttendanceDepartment,
} = require("../middleware/attendanceAccess");
const deptAdminController = require("../controllers/deptAdminController");

router.use('/student',      require("./student"));
router.get(
    '/dept-admin/context',
    ...attendanceRoleAccess,
    deptAdminController.getContext,
);
router.get(
    '/dept-admin/stats/today',
    ...attendanceRoleAccess,
    deptAdminController.getTodayAttendanceStats,
);
router.get(
    '/dept-admin/reports',
    ...attendanceRoleAccess,
    deptAdminController.getReports,
);
router.use(
    '/ground-truth',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./groundTruthRoutes"),
);
router.use(
    '/roll-assign',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./rollAssignRoutes"),
);
router.use(
    '/flags',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./flagRoutes"),
);
router.use('/reports',      require("./attendanceReportRoutes"));
router.use('/cameras',      require("./cameraRoutes"));
router.use('/embeddings',   require("./embeddingRouter"));
router.use('/frame-verification', require("./frameVerificationRoutes"));
router.use('/ground-truth-upload', require("./groundTruthUploadRoutes"));
router.use('/acquisition-control', acquisitionControlRoutes);
router.use('/settings/batches', require("./batchSettingsRoutes"));
router.use('/health', require("./healthRoutes"));
router.use('/unknown-faces', require("./unknownFaceRoutes"));

module.exports = router;

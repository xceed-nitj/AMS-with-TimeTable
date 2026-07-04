const express = require("express");
const router  = express.Router();
const acquisitionControlRoutes = require('./acquisitionControlRoutes');
const schedulerRoutes = require('./schedulerRoutes');

const {
    attendanceRoleAccess,
    enforceAttendanceDepartment,
} = require("../middleware/attendanceAccess");
const deptAdminController = require("../controllers/deptAdminController");

router.use('/student',      ...attendanceRoleAccess, require("./student"));
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
    '/dept-admin/stats/progress',
    ...attendanceRoleAccess,
    deptAdminController.getDashboardProgress,
);
router.get(
    '/dept-admin/reports',
    ...attendanceRoleAccess,
    deptAdminController.getReports,
);
router.get(
    '/dept-admin/menus',
    ...attendanceRoleAccess,
    deptAdminController.getDeptMenus,
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

// /reports: attendanceReportRoutes.js applies attendanceRoleAccess itself,
// per-route, so the ERP override PATCH (called by an external system with no
// browser session) can stay unauthenticated while every other route in that
// file is gated — see the comment at that route for details.
router.use('/reports',      require("./attendanceReportRoutes"));
router.use(
    '/cameras',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./cameraRoutes"),
);
router.use(
    '/embeddings',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./embeddingRouter"),
);
router.use(
    '/frame-verification',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./frameVerificationRoutes"),
);
router.use(
    '/ground-truth-upload',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./groundTruthUploadRoutes"),
);
router.use(
    '/acquisitioncontrol',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    acquisitionControlRoutes,
);
router.use(
    '/scheduler',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    schedulerRoutes,
);
router.use(
    '/settings/batches',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./batchSettingsRoutes"),
);
router.use(
    '/settings/notifications',
    ...attendanceRoleAccess,
    require("./notificationSettingsRoutes"),
);
router.use(
    '/health',
    ...attendanceRoleAccess,
    require("./healthRoutes"),
);
router.use(
    '/unknown-faces',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./unknownFaceRoutes"),
);
router.use(
    '/mldatafoldertree',
    ...attendanceRoleAccess,
    require("./mldataFolderSizeRoutes"),
);

module.exports = router;

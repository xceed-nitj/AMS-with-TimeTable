const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs");
const acquisitionControlRoutes = require('./acquisitionControlRoutes');
const schedulerRoutes = require('./schedulerRoutes');

const {
    attendanceRoleAccess,
    enforceAttendanceDepartment,
    requireDeptMenu,
} = require("../middleware/attendanceAccess");
const deptAdminController = require("../controllers/deptAdminController");

const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

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
    '/dept-admin/stats/overrides-by-dept',
    ...attendanceRoleAccess,
    deptAdminController.getOverridesByDept,
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

// /reports: attendanceReportRoutes.js applies route-specific guards because
// browser reads are role-based while attendance writes are service-key based.
router.use('/reports',      require("./attendanceReportRoutes"));

// INTENTIONALLY LEFT OFF the cookie-based role check: these are called by
// ERP itself, not a logged-in browser session. Protected instead by HMAC
// signature + optional IP allowlist + rate limiting — see erpInboundRoutes.js.
router.use('/erp',          require("./erpInboundRoutes"));
router.use('/firstyearsubjectmapping', require("./firstYearSubjectMappingRoutes"));
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
    '/erp-sync',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    requireDeptMenu('erpSync'),
    require("./erpSyncRoutes"),
);
router.use(
    '/erp-push',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    requireDeptMenu('erpSync'),
    require("./erpPushRoutes"),
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
    requireDeptMenu('erpUpload'),
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
router.use('/settings/frame-cleanup',
    ...attendanceRoleAccess,
    require("./frameCleanupSettingsRoutes"));
router.use('/settings/other-controls',
    ...attendanceRoleAccess,
    require("./otherControlsSettingsRoutes"));
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
router.use(
    '/institute',
    ...attendanceRoleAccess,
    enforceAttendanceDepartment,
    require("./instituteIdentificationRoutes"),
);

// INTENTIONALLY LEFT UNAUTHENTICATED: called by the Python ML service itself
// (institute_identification_routes.py's get_ground_truth_b64()), not a
// browser session. Read-only, single-photo lookup by roll number, low
// sensitivity; attendance write endpoints are service-key protected instead.
router.get('/ground-truth-photo-by-roll/:rollNo', async (req, res) => {
    try {
        const rollNo = String(req.params.rollNo || '').trim();
        if (!rollNo) return res.json({ photo: '' });

        if (fs.existsSync(GROUND_TRUTH_DIR)) {
            const batches = await fs.promises.readdir(GROUND_TRUTH_DIR, { withFileTypes: true });
            for (const batchEntry of batches) {
                if (!batchEntry.isDirectory()) continue;
                const batchPath = path.join(GROUND_TRUTH_DIR, batchEntry.name);
                const folders = await fs.promises.readdir(batchPath, { withFileTypes: true });
                const match = folders.find(
                    (f) => f.isDirectory() && (f.name === rollNo || f.name.startsWith(`${rollNo}_`)),
                );
                if (!match) continue;

                const studentPath = path.join(batchPath, match.name);
                const photos = (await fs.promises.readdir(studentPath))
                    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
                if (photos.length === 0) continue;

                const bytes = await fs.promises.readFile(path.join(studentPath, photos[0]));
                return res.json({ photo: bytes.toString('base64') });
            }
        }
        res.json({ photo: '' });
    } catch (err) {
        res.json({ photo: '' });
    }
});

module.exports = router;

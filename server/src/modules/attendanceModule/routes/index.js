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

// INTENTIONALLY LEFT UNAUTHENTICATED: called by the Python ML service itself
// (clustering_service.py's _reject_uploader), not a browser session. Receives
// liveness-rejected face crops as base64 and stores them in this server's
// ml-data/liveness_rejected/ — the ML service keeps no local copy (it may run
// on a separate machine). Write-only, strict filename whitelist, capped dir.
const LIVENESS_REJECTED_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'liveness_rejected');
const LIVENESS_REJECTED_MAX = 2000;   // keep newest N crops; prune the rest

router.post('/liveness-rejected', async (req, res) => {
    try {
        const { filename, image } = req.body || {};
        // {ts_ms}_{DEPT?}_{method}{score}_det{score}.jpg — no separators/dots
        // beyond the extension, so a hostile filename can't escape the dir.
        if (typeof filename !== 'string' || !/^[0-9]{10,17}[A-Za-z0-9_.\-]*\.jpg$/.test(filename)
            || filename.includes('..') || !image || typeof image !== 'string') {
            return res.status(400).json({ error: 'bad filename or image' });
        }
        await fs.promises.mkdir(LIVENESS_REJECTED_DIR, { recursive: true });
        await fs.promises.writeFile(
            path.join(LIVENESS_REJECTED_DIR, filename),
            Buffer.from(image, 'base64'),
        );

        // Retention: ms-timestamp filename prefix sorts chronologically, so
        // dropping the lexicographically smallest removes the oldest crops.
        const files = (await fs.promises.readdir(LIVENESS_REJECTED_DIR))
            .filter((f) => f.endsWith('.jpg')).sort();
        if (files.length > LIVENESS_REJECTED_MAX) {
            await Promise.all(files.slice(0, files.length - LIVENESS_REJECTED_MAX)
                .map((f) => fs.promises.unlink(path.join(LIVENESS_REJECTED_DIR, f)).catch(() => {})));
        }
        res.json({ saved: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

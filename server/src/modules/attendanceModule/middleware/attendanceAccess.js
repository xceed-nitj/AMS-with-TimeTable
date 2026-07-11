const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');
const Batch = require('../../../models/attendanceModule/batch');
const { checkRole } = require('../../checkRole.middleware');
const getUserDetails = require('../../usermanagement/controllers/dto');
const crypto = require('crypto');

const normalizeDepartment = (value) =>
    String(value || '').trim().replace(/[\s_-]+/g, '').toUpperCase();

const batchBelongsToDepartment = (batch, department) => {
    const safeDepartment = String(department || '')
        .trim()
        .replace(/[\s-]+/g, '_')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^[^_]+_${safeDepartment}_`, 'i').test(String(batch || ''));
};

const timingSafeEqual = (provided, expected) => {
    const providedBuffer = Buffer.from(String(provided || ''));
    const expectedBuffer = Buffer.from(String(expected || ''));
    return (
        providedBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    );
};

const getAttendanceWriteSecret = () =>
    process.env.ML_SERVICE_SECRET || '';

const requireAttendanceWriteAccess = (req, res, next) => {
    const secret = getAttendanceWriteSecret();
    if (!secret) {
        return res.status(503).json({
            error: 'Attendance service write access is not configured.',
        });
    }

    const provided = req.get('X-ML-Service-Key') || '';
    if (!timingSafeEqual(provided, secret)) {
        return res.status(401).json({ error: 'Unauthorized attendance writer.' });
    }

    req.attendanceServiceWrite = true;
    next();
};

const resolveAttendanceAccess = async (req, res, next) => {
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles].filter(Boolean);
    if (roles.includes('iams-admin') || roles.includes('admin')) {
        req.attendanceFullAccess = true;
        req.attendanceDepartment = null;
        return next();
    }

    const user = await getUserDetails(req.user.id);
    if (!user?.department) {
        return res.status(403).json({
            message: 'No Faculty profile with a department matches this user email.',
        });
    }

    req.attendanceFullAccess = false;
    req.attendanceDepartment = user.department;
    next();
};

const enforceAttendanceDepartment = async (req, res, next) => {
    try {
        if (req.attendanceFullAccess) return next();

        const department = req.attendanceDepartment;
        const requestedDepartments = [
            req.body?.department,
            req.body?.dept,
            req.params?.department,
            req.params?.dept,
            req.query?.department,
            req.query?.dept,
        ].filter(Boolean);

        const invalidDepartment = requestedDepartments.some(
            (value) => normalizeDepartment(value) !== normalizeDepartment(department),
        );
        if (invalidDepartment) {
            return res.status(403).json({ message: 'Department access denied.' });
        }

        const batches = [
            req.body?.batch,
            req.params?.batch,
            req.query?.batch,
        ].filter(Boolean);

        const pathSegments = req.path
            .split('/')
            .filter(Boolean)
            .map((segment) => {
                try { return decodeURIComponent(segment); }
                catch { return segment; }
            });
        const pathBatch = pathSegments.find(
            (segment) => /^[A-Z0-9]+_.+_\d{4}$/i.test(segment),
        );
        if (pathBatch) batches.push(pathBatch);

        const recordId = req.body?.id
            || pathSegments.find((segment) => /^[a-f\d]{24}$/i.test(segment))
            || null;
        if (recordId) {
            const record = await ClusterMatch.findById(recordId).select('batch').lean();
            if (!record) {
                return res.status(404).json({ message: 'Ground-truth record not found.' });
            }
            batches.push(record.batch);
        }

        const invalidBatch = batches.some(
            (batch) => !batchBelongsToDepartment(batch, department),
        );
        if (invalidBatch) {
            return res.status(403).json({ message: 'Batch access denied.' });
        }

        if (
            req.path.startsWith('/erp-photo/')
            && !pathBatch
            && batches.length === 0
        ) {
            return res.status(403).json({ message: 'Batch is required for department access.' });
        }

        next();
    } catch (error) {
        console.error('[AttendanceAccess]', error);
        res.status(500).json({ message: 'Failed to verify department access.' });
    }
};

// Mirrors the deptMenus toggle in DeptMenuConfig.jsx server-side, so a dept
// with a menu switched off can't reach the underlying API directly (the
// frontend toggle previously only hid the sidebar link). Full-access admins
// manage the toggles themselves and always bypass this check, same as
// enforceAttendanceDepartment above. Fetched without .lean() so Mongoose
// applies the subdocument's schema defaults for keys missing on older
// Batch documents, matching how getDeptMenus already reads this field.
const requireDeptMenu = (menuKey) => async (req, res, next) => {
    try {
        if (req.attendanceFullAccess) return next();

        const batch = await Batch.findOne({}).sort({ batchYear: -1 });
        if (batch?.deptMenus?.[menuKey] !== true) {
            return res.status(403).json({ message: 'This feature is not enabled for your department.' });
        }
        next();
    } catch (error) {
        console.error('[AttendanceAccess] requireDeptMenu', error);
        res.status(500).json({ message: 'Failed to verify menu access.' });
    }
};

const attendanceRoleAccess = [
    checkRole(['iams-admin', 'iams-dept-admin']),
    resolveAttendanceAccess,
];

module.exports = {
    attendanceRoleAccess,
    enforceAttendanceDepartment,
    requireAttendanceWriteAccess,
    requireDeptMenu,
    batchBelongsToDepartment,
    normalizeDepartment,
};

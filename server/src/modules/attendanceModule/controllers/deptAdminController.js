const AttendanceReport = require('../../../models/attendanceReport');
const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const departmentRegex = (department) => {
    const variants = [
        department,
        department.replace(/\s+/g, '_'),
        department.replace(/_/g, ' '),
    ].map(escapeRegex);

    return new RegExp(`^(?:${[...new Set(variants)].join('|')})$`, 'i');
};

const batchDepartmentRegex = (department) => {
    const normalized = escapeRegex(department.trim().replace(/\s+/g, '_'));
    return new RegExp(`^[^_]+_${normalized}_`, 'i');
};

const getCampusDate = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
}).format(new Date());

const getContext = async (req, res) => {
    res.json({
        department: req.attendanceDepartment,
        batchDepartment: req.attendanceDepartment?.replace(/\s+/g, '_') || null,
        fullAccess: Boolean(req.attendanceFullAccess),
    });
};

const getTodayAttendanceStats = async (req, res) => {
    try {
        const department = req.attendanceDepartment;
        const today = getCampusDate();
        const reportMatch = {
            date: today,
            ...(req.attendanceFullAccess ? {} : { department: departmentRegex(department) }),
        };
        const reportScope = req.attendanceFullAccess
            ? {}
            : { department: departmentRegex(department) };
        const groundTruthScope = req.attendanceFullAccess
            ? {}
            : { batch: batchDepartmentRegex(department) };

        const [yearStats, statusStats, groundTruthStats, recentReports] = await Promise.all([
            AttendanceReport.aggregate([
                { $match: reportMatch },
                {
                    $addFields: {
                        semesterNumber: {
                            $convert: {
                                input: '$semester',
                                to: 'int',
                                onError: 0,
                                onNull: 0,
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        year: {
                            $cond: [
                                { $gt: ['$semesterNumber', 0] },
                                { $ceil: { $divide: ['$semesterNumber', 2] } },
                                null,
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: '$year',
                        present: { $sum: '$summary.present' },
                        totalStudents: { $sum: '$summary.totalStudents' },
                        review: { $sum: '$summary.review' },
                        sessions: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            AttendanceReport.aggregate([
                { $match: reportMatch },
                {
                    $group: {
                        _id: null,
                        present: { $sum: '$summary.present' },
                        absent: { $sum: '$summary.absent' },
                        review: { $sum: '$summary.review' },
                        totalStudents: { $sum: '$summary.totalStudents' },
                        sessions: { $sum: 1 },
                    },
                },
            ]),
            ClusterMatch.aggregate([
                { $match: groundTruthScope },
                {
                    $group: {
                        _id: null,
                        pending: {
                            $sum: { $cond: [{ $eq: ['$approved', false] }, 1, 0] },
                        },
                        approved: {
                            $sum: { $cond: [{ $eq: ['$approved', true] }, 1, 0] },
                        },
                        approvedConfidenceTotal: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$approved', true] },
                                            { $ne: ['$confidence', null] },
                                        ],
                                    },
                                    '$confidence',
                                    0,
                                ],
                            },
                        },
                        approvedWithConfidence: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$approved', true] },
                                            { $ne: ['$confidence', null] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            AttendanceReport.find(reportScope)
                .select('batch semester subject faculty room date timeSlot summary status')
                .sort({ date: -1, created_at: -1 })
                .limit(6)
                .lean(),
        ]);

        const totals = statusStats[0] || {};
        const groundTruth = groundTruthStats[0] || {};
        const attendancePct = totals.totalStudents > 0
            ? Math.round((totals.present / totals.totalStudents) * 100)
            : null;
        const matchAccuracy = groundTruth.approvedWithConfidence > 0
            ? Math.round(
                (groundTruth.approvedConfidenceTotal / groundTruth.approvedWithConfidence) * 100,
            )
            : null;

        res.json({
            department: req.attendanceFullAccess ? 'Institute' : department,
            fullAccess: Boolean(req.attendanceFullAccess),
            date: today,
            attendancePct,
            present: totals.present || 0,
            absent: totals.absent || 0,
            review: totals.review || 0,
            totalStudents: totals.totalStudents || 0,
            sessions: totals.sessions || 0,
            groundTruthPending: groundTruth.pending || 0,
            groundTruthApproved: groundTruth.approved || 0,
            matchAccuracy,
            byYear: yearStats
                .filter((item) => item._id != null)
                .map((item) => ({
                    year: item._id,
                    attendancePct: item.totalStudents > 0
                        ? Math.round((item.present / item.totalStudents) * 100)
                        : null,
                    present: item.present,
                    totalStudents: item.totalStudents,
                    review: item.review,
                    sessions: item.sessions,
                })),
            recentReports,
        });
    } catch (error) {
        console.error('[DeptAdmin] getTodayAttendanceStats:', error);
        res.status(500).json({ message: 'Failed to fetch attendance statistics.' });
    }
};

const getReports = async (req, res) => {
    try {
        const { date, status, limit = 50 } = req.query;
        const filter = req.attendanceFullAccess
            ? {}
            : { department: departmentRegex(req.attendanceDepartment) };
        if (date) filter.date = date;
        if (status) filter.status = status;

        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
        const reports = await AttendanceReport.find(filter)
            .select('batch semester subject faculty room date timeSlot summary status')
            .sort({ date: -1, created_at: -1 })
            .limit(safeLimit)
            .lean();

        res.json({
            department: req.attendanceFullAccess ? 'Institute' : req.attendanceDepartment,
            fullAccess: Boolean(req.attendanceFullAccess),
            reports,
        });
    } catch (error) {
        console.error('[DeptAdmin] getReports:', error);
        res.status(500).json({ message: 'Failed to fetch department reports.' });
    }
};

module.exports = {
    getContext,
    getTodayAttendanceStats,
    getReports,
};

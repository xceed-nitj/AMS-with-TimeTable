const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const AttendanceReport = require('../../../models/attendanceReport');
const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');
const StudentEmbedding = require('../../../models/attendanceModule/studentEmbedding');
const Subject = require('../../../models/subject');

const ERP_PHOTOS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'erp_photos');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeDepartmentKey = (value) =>
    String(value || '').trim().replace(/[\s_-]+/g, '').toUpperCase();

const normalizeSubjectKey = (value) =>
    String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();

const normalizeBatchKey = (value) =>
    String(value || '').trim().replace(/[\s_-]+/g, '').toUpperCase();

const imageExtRegex = /\.(jpg|jpeg|png|webp)$/i;

const formatDepartment = (value) =>
    String(value || '').trim().replace(/_/g, ' ');

const displayDepartment = (value) => {
    const department = formatDepartment(value);
    if (/^[A-Z]{2,5}$/.test(department)) return department;
    return department.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Unknown';
};

const departmentVariants = (department) => {
    return [...new Set([
        department,
        formatDepartment(department),
    ].filter(Boolean).flatMap((item) => {
        const text = String(item).trim();
        return [text, text.replace(/\s+/g, '_'), text.replace(/_/g, ' ')];
    }))];
};

const departmentRegex = (department) => {
    const variants = departmentVariants(department).map(escapeRegex);
    return new RegExp(`^(?:${variants.join('|')})$`, 'i');
};

const batchDepartmentRegex = (department) => {
    const variants = departmentVariants(department)
        .map((item) => escapeRegex(item.trim().replace(/\s+/g, '_')))
        .filter(Boolean);
    return new RegExp(`^[^_]+_(?:${[...new Set(variants)].join('|')})_`, 'i');
};

const parseBatch = (batch) => {
    const parts = String(batch || '').split('_').filter(Boolean);
    if (parts.length < 3) {
        const department = displayDepartment(batch);
        return {
            batch,
            degree: parts[0] || '',
            department,
            year: '',
            departmentKey: normalizeDepartmentKey(department),
        };
    }

    const year = parts[parts.length - 1];
    const degree = parts[0];
    const department = displayDepartment(parts.slice(1, -1).join('_'));
    return {
        batch,
        degree,
        department,
        year,
        departmentKey: normalizeDepartmentKey(department),
    };
};

const rollNoFromImage = (file) =>
    path.basename(String(file || ''), path.extname(String(file || ''))).trim().toUpperCase();

const readImageRollNos = async (dir) => {
    try {
        const files = await fsPromises.readdir(dir);
        return files
            .filter((file) => imageExtRegex.test(file))
            .map(rollNoFromImage)
            .filter(Boolean);
    } catch (_) {
        return [];
    }
};

const getBatchYearPrefix = (year) =>
    /^\d{4}$/.test(String(year || '')) ? String(year).slice(-2) : '';

const getErpRollNosForBatch = async (batch) => {
    const parsed = parseBatch(batch);
    const rollNos = new Set();

    const batchDir = path.join(ERP_PHOTOS_DIR, batch);
    for (const rollNo of await readImageRollNos(batchDir)) {
        rollNos.add(rollNo);
    }

    // Legacy uploads may be flat under erp_photos/. Only include root photos
    // whose roll number year prefix matches this batch year.
    const yearPrefix = getBatchYearPrefix(parsed.year);
    if (yearPrefix && fs.existsSync(ERP_PHOTOS_DIR)) {
        for (const rollNo of await readImageRollNos(ERP_PHOTOS_DIR)) {
            if (rollNo.startsWith(yearPrefix)) rollNos.add(rollNo);
        }
    }

    return rollNos;
};

const pct = (done, total) => (
    total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
);

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
            .select('batch department semester subject faculty room date timeSlot summary status')
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
const Batch = require('../../../models/attendanceModule/batch');

const getDashboardProgress = async (req, res) => {
    try {
        const scopedDepartment = req.attendanceFullAccess ? null : req.attendanceDepartment;
        const scopedDepartmentKey = scopedDepartment ? normalizeDepartmentKey(scopedDepartment) : null;
        const batchScope = req.attendanceFullAccess
            ? {}
            : { batch: batchDepartmentRegex(scopedDepartment) };

        const approvedFilter = {
            ...batchScope,
            $or: [
                { approved: true },
                { status: 'approved' },
            ],
        };

        const [approvedRecords, theorySubjects, completedEmbeddings] = await Promise.all([
            ClusterMatch.find(approvedFilter)
                .select('batch rollNo erpPhoto approved status')
                .lean(),
            Subject.find({
                type: { $regex: /^theory$/i },
                ...(req.attendanceFullAccess ? {} : { dept: departmentRegex(scopedDepartment) }),
            }).select('dept sem subCode subName subjectFullName').lean(),
            StudentEmbedding.find({
                status: 'done',
                ...(req.attendanceFullAccess ? {} : { dept: departmentRegex(scopedDepartment) }),
            }).select('dept sem subject subjectCode embeddingFile generatedAt').lean(),
        ]);

        const batchMap = new Map();
        const erpDepartments = new Map();

        if (fs.existsSync(ERP_PHOTOS_DIR)) {
            const entries = await fsPromises.readdir(ERP_PHOTOS_DIR, { withFileTypes: true });
            await Promise.all(entries.map(async (entry) => {
                if (!entry.isDirectory()) return;
                const parsed = parseBatch(entry.name);
                if (scopedDepartmentKey && parsed.departmentKey !== scopedDepartmentKey) return;
                if (!erpDepartments.has(parsed.departmentKey)) {
                    erpDepartments.set(parsed.departmentKey, {
                        key: parsed.departmentKey,
                        label: parsed.department,
                    });
                }
                batchMap.set(entry.name, {
                    ...parsed,
                    hasErpBatch: true,
                    batchKey: normalizeBatchKey(entry.name),
                    erpRollNos: await getErpRollNosForBatch(entry.name),
                    approvedRollNos: new Set(),
                    approvedRecordCount: 0,
                    outOfBatchApprovedRollNos: new Set(),
                });
            }));
        }

        const erpRows = [...batchMap.values()];
        for (const record of approvedRecords) {
            const rollNo = rollNoFromImage(record.rollNo || record.erpPhoto);
            if (!rollNo) continue;
            const recordBatchKey = normalizeBatchKey(record.batch);
            const recordDepartmentKey = parseBatch(record.batch).departmentKey;

            const sameBatchRow = erpRows.find((row) => row.batchKey === recordBatchKey);
            let targetRow = sameBatchRow?.erpRollNos.has(rollNo) ? sameBatchRow : null;
            if (!targetRow) {
                targetRow = erpRows.find((row) =>
                    row.departmentKey === recordDepartmentKey && row.erpRollNos.has(rollNo));
            }

            if (targetRow) {
                targetRow.approvedRollNos.add(rollNo);
                targetRow.approvedRecordCount += 1;
                continue;
            }

            if (sameBatchRow) {
                sameBatchRow.outOfBatchApprovedRollNos.add(rollNo);
                sameBatchRow.approvedRecordCount += 1;
                continue;
            }

            const parsed = parseBatch(record.batch);
            if (scopedDepartmentKey && parsed.departmentKey !== scopedDepartmentKey) continue;
            const missingKey = record.batch || `UNKNOWN_${rollNo}`;
            if (!batchMap.has(missingKey)) {
                batchMap.set(missingKey, {
                    ...parsed,
                    hasErpBatch: false,
                    batchKey: recordBatchKey,
                    erpRollNos: new Set(),
                    approvedRollNos: new Set(),
                    approvedRecordCount: 0,
                    outOfBatchApprovedRollNos: new Set(),
                });
                erpRows.push(batchMap.get(missingKey));
            }
            const missingRow = batchMap.get(missingKey);
            missingRow.outOfBatchApprovedRollNos.add(rollNo);
            missingRow.approvedRecordCount += 1;
        }

        const departments = new Map();
        for (const row of batchMap.values()) {
            const erpPhotoCount = row.erpRollNos.size;
            const approvedAssignments = row.approvedRollNos.size;
            const outOfBatchApprovedAssignments = row.outOfBatchApprovedRollNos.size;
            if (!departments.has(row.departmentKey)) {
                departments.set(row.departmentKey, {
                    department: row.department,
                    departmentKey: row.departmentKey,
                    erpPhotoCount: 0,
                    approvedAssignments: 0,
                    progressPct: 0,
                    batches: [],
                });
            }
            const dept = departments.get(row.departmentKey);
            dept.erpPhotoCount += erpPhotoCount;
            dept.approvedAssignments += approvedAssignments;
            dept.batches.push({
                batch: row.batch,
                degree: row.degree,
                year: row.year,
                hasErpBatch: row.hasErpBatch,
                erpPhotoCount,
                approvedAssignments,
                approvedRecordCount: row.approvedRecordCount,
                outOfBatchApprovedAssignments,
                progressPct: pct(approvedAssignments, erpPhotoCount),
            });
        }

        const groundTruthProgress = [...departments.values()]
            .map((dept) => ({
                ...dept,
                progressPct: pct(dept.approvedAssignments, dept.erpPhotoCount),
                batches: dept.batches.sort((a, b) => a.batch.localeCompare(b.batch)),
            }))
            .sort((a, b) => a.department.localeCompare(b.department));

        const subjectTotals = new Map();
        for (const subject of theorySubjects) {
            const department = displayDepartment(subject.dept);
            const deptKey = normalizeDepartmentKey(department);
            const sem = String(subject.sem || '').trim();
            const subjectKey = normalizeSubjectKey(
                subject.subCode || subject.subName || subject.subjectFullName,
            );
            if (!deptKey || !sem || !subjectKey) continue;
            const key = `${deptKey}|${sem}`;
            if (!subjectTotals.has(key)) {
                subjectTotals.set(key, {
                    department,
                    departmentKey: deptKey,
                    sem,
                    totalSubjects: 0,
                    completedSubjects: 0,
                    progressPct: 0,
                    subjectKeys: new Set(),
                    completedKeys: new Set(),
                    aliasToCanonical: new Map(),
                });
            }
            const bucket = subjectTotals.get(key);
            if (!bucket.subjectKeys.has(subjectKey)) {
                bucket.subjectKeys.add(subjectKey);
                bucket.totalSubjects += 1;
            }
            [
                subject.subCode,
                subject.subName,
                subject.subjectFullName,
            ].map(normalizeSubjectKey)
                .filter(Boolean)
                .forEach((alias) => bucket.aliasToCanonical.set(alias, subjectKey));
        }

        for (const embedding of completedEmbeddings) {
            const deptKey = normalizeDepartmentKey(displayDepartment(embedding.dept));
            const sem = String(embedding.sem || '').trim();
            const key = `${deptKey}|${sem}`;
            const bucket = subjectTotals.get(key);
            if (!bucket) continue;
            const embeddingAliases = [
                embedding.subjectCode,
                embedding.subject,
            ].map(normalizeSubjectKey).filter(Boolean);
            for (const alias of embeddingAliases) {
                const canonical = bucket.aliasToCanonical.get(alias)
                    || [...bucket.subjectKeys].find((item) =>
                        item === alias || item.includes(alias) || alias.includes(item));
                if (canonical) {
                    bucket.completedKeys.add(canonical);
                    break;
                }
            }
        }

        const embeddingProgress = [...subjectTotals.values()]
            .map((bucket) => {
                const completedSubjects = bucket.completedKeys.size;
                return {
                    department: bucket.department,
                    departmentKey: bucket.departmentKey,
                    sem: bucket.sem,
                    totalSubjects: bucket.totalSubjects,
                    completedSubjects,
                    progressPct: pct(completedSubjects, bucket.totalSubjects),
                };
            })
            .sort((a, b) => {
                const deptSort = a.department.localeCompare(b.department);
                if (deptSort) return deptSort;
                const aSem = Number(a.sem);
                const bSem = Number(b.sem);
                if (!Number.isNaN(aSem) && !Number.isNaN(bSem)) return aSem - bSem;
                return a.sem.localeCompare(b.sem);
            });

        const summary = {
            erpPhotoCount: groundTruthProgress.reduce((sum, item) => sum + item.erpPhotoCount, 0),
            approvedAssignments: groundTruthProgress.reduce((sum, item) => sum + item.approvedAssignments, 0),
            theorySubjects: embeddingProgress.reduce((sum, item) => sum + item.totalSubjects, 0),
            completedSubjectEmbeddings: embeddingProgress.reduce((sum, item) => sum + item.completedSubjects, 0),
        };

        res.json({
            department: req.attendanceFullAccess ? 'Institute' : scopedDepartment,
            fullAccess: Boolean(req.attendanceFullAccess),
            departments: [...erpDepartments.values()]
                .sort((a, b) => a.label.localeCompare(b.label)),
            summary: {
                ...summary,
                groundTruthProgressPct: pct(summary.approvedAssignments, summary.erpPhotoCount),
                embeddingProgressPct: pct(summary.completedSubjectEmbeddings, summary.theorySubjects),
            },
            groundTruthProgress,
            embeddingProgress,
        });
    } catch (error) {
        console.error('[DeptAdmin] getDashboardProgress:', error);
        res.status(500).json({ message: 'Failed to calculate dashboard progress.' });
    }
};

const getDeptMenus = async (req, res) => {
    try {
        const batch = await Batch.findOne({}).sort({ batchYear: -1 });
        const defaults = {
    dashboard: true,
    groundTruth: true,
    rollAssignment: true,
    erpUpload: true,
    attendanceReports: true,
    classVerification: true,
    cameraRegistry: true,   // ← new
    subjectEmbeddings: true,
    livePreview: true,
    gpuMetrics: true,       // ← new
    confidenceMonitor: true,
    erpOverrides: false,    // off by default — enable per-dept from Dept Menu Config
    erpSync: false,         // off by default — enable per-dept from Dept Menu Config
    helpManual: true,
};
        res.json({ deptMenus: batch?.deptMenus ?? defaults });
    } catch (error) {
        console.error('[DeptAdmin] getDeptMenus:', error);
        res.status(500).json({ message: 'Failed to fetch dept menu config.' });
    }
};

module.exports = {
    getContext,
    getTodayAttendanceStats,
    getDashboardProgress,
    getReports,
    getDeptMenus,
};

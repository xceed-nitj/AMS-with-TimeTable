// server/src/modules/attendanceModule/controllers/erpOverrideSyncController.js
//
// Inbound faculty-override sync (spec §13): ERP calls us once every time
// faculty finalises or re-finalises a period, carrying the complete
// roll-by-roll final status and remarks. We NEVER overwrite our own
// attendance data (finalStatus/summary) — the correction lands in the same
// separate erpOverriddenStatus/erpOverriddenAt/facultyRemark fields the
// single-student override endpoint uses (see applyErpOverride in
// attendanceReportController.js). Remarks are stored exactly as ERP sends
// them — no vocabulary validation against our own coordinatorRemark enum.
//
// POST /attendancemodule/erp/faculty-override-sync
// Body: { periodId, facultyLockedAt, finalAttendance: [{ rollNo, finalStatus: 'PRESENT'|'ABSENT', remarks: string|null }] }
// Protected by verifyErpSignature/ipAllowlist/rate limiters (see
// middleware/erpInboundSecurity.js) — NOT by the cookie-based role check,
// since the caller is ERP itself, not a logged-in browser session.

const AttendanceReport = require('../../../models/attendanceReport');

function mapErpStatus(finalStatus) {
    if (finalStatus === 'PRESENT') return 'P';
    if (finalStatus === 'ABSENT') return 'A';
    return null;
}

async function facultyOverrideSync(req, res) {
    const { periodId, facultyLockedAt, finalAttendance } = req.body || {};

    if (!periodId || !facultyLockedAt || !Array.isArray(finalAttendance)) {
        return res.status(400).json({
            status: 'FAILURE',
            responseCode: 'INVALID_PAYLOAD',
            message: 'periodId, facultyLockedAt and finalAttendance[] are required.',
        });
    }
    const lockedAt = new Date(facultyLockedAt);
    if (Number.isNaN(lockedAt.getTime())) {
        return res.status(400).json({
            status: 'FAILURE',
            responseCode: 'INVALID_PAYLOAD',
            message: 'facultyLockedAt is not a valid timestamp.',
        });
    }
    for (const entry of finalAttendance) {
        if (!entry || typeof entry.rollNo !== 'string' || !mapErpStatus(entry.finalStatus)) {
            return res.status(400).json({
                status: 'FAILURE',
                responseCode: 'INVALID_PAYLOAD',
                message: `Malformed finalAttendance entry for rollNo ${entry?.rollNo ?? '(missing)'}.`,
            });
        }
    }

    const report = await AttendanceReport.findOne({ periodId });
    if (!report) {
        return res.status(404).json({
            status: 'FAILURE',
            responseCode: 'PERIOD_NOT_FOUND',
            periodId,
            message: 'No report found for this periodId.',
        });
    }

    // Exact same lock timestamp already applied — duplicate push racing a
    // manual pull, or a plain retry. Safe no-op (spec §13.2).
    if (report.facultyLockedAt && report.facultyLockedAt.getTime() === lockedAt.getTime()) {
        return res.status(409).json({
            status: 'SUCCESS',
            responseCode: 'SYNC_ALREADY_APPLIED',
            periodId,
            facultyLockedAt,
        });
    }

    for (const entry of finalAttendance) {
        const student = report.finalReport.find((s) => s.rollNo === entry.rollNo);
        if (!student) continue; // not in our roster for this period — nothing to record

        const mapped = mapErpStatus(entry.finalStatus);
        if (mapped !== student.finalStatus) {
            student.erpOverriddenStatus = mapped;
            student.erpOverriddenAt = new Date();
            student.isOverridden = true;
        }
        // Stored verbatim — remarks null (faculty left the value unchanged)
        // clears any stale remark rather than being coerced to a string.
        if (entry.remarks != null) {
            student.facultyRemark = String(entry.remarks);
        }
    }

    report.facultyLockedAt = lockedAt;
    report.erpLockState = 'faculty_finalized';
    await report.save();

    res.json({
        status: 'SUCCESS',
        responseCode: 'SYNC_ACCEPTED',
        periodId,
        facultyLockedAt,
    });
}

module.exports = { facultyOverrideSync, mapErpStatus };

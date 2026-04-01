// server/src/modules/attendanceModule/controllers/attendanceReportController.js
//
// Roadmap coverage:
//   • saveReport        — called after ML processes a video; saves slot result + merges final
//   • getReports        — list all reports for a batch (with filters)
//   • getReportById     — full detail of one report
//   • getReportByDate   — reports for a batch on a specific date
//   • finalizeReport    — lock the report (draft → finalized)
//   • deleteReport      — remove a draft report
//   • getStudentHistory — all sessions for a specific roll number in a batch
//
// Logic (from notebook bottom-left):
//   "Along with present/absent, gives confidence score.
//    By merging both, logic gives final status."
//
//   Merge rule per student across slots:
//     • If any slot = present with high/medium confidence → final P
//     • If all slots = absent → final A
//     • If mix of present(low) and absent → final R (Review)

const AttendanceReport = require('../../../models/attendanceReport');
const LockSem          = require('../../../models/locksem');

// ── Merge logic (notebook: merging both → final status) ──────
function mergeStudentStatus(slotResults) {
    // Build roll → list of slot statuses
    const rollMap = {};

    for (const slot of slotResults) {
        for (const s of slot.students) {
            if (!rollMap[s.rollNo]) rollMap[s.rollNo] = [];
            rollMap[s.rollNo].push({
                status:         s.status,
                avgConfidence:  s.avgConfidence,
                confidenceZone: s.confidenceZone,
                firstSeenSec:   s.firstSeenSec,
                clusterFolder:  s.clusterFolder,
                slot:           slot.slot,
            });
        }
    }

    const finalReport = [];
    for (const [rollNo, entries] of Object.entries(rollMap)) {
        const latestEntry = entries[entries.length - 1];

        // Find best confidence entry
        const best = entries.reduce((prev, cur) =>
            cur.avgConfidence > prev.avgConfidence ? cur : prev, entries[0]);

        // Merge rule
        const presentEntries = entries.filter(e => e.status === 'present');
        const highConf       = presentEntries.filter(e => e.confidenceZone !== 'low');
        const anyPresent     = presentEntries.length > 0;
        const allAbsent      = entries.every(e => e.status === 'absent');
        const anyReview      = entries.some(e => e.status === 'review');

        let finalStatus;
        if (highConf.length > 0) {
            finalStatus = 'P';
        } else if (anyPresent && !allAbsent) {
            // present but low confidence OR mixed → Review
            finalStatus = 'R';
        } else if (anyReview) {
            finalStatus = 'R';
        } else if (allAbsent) {
            finalStatus = 'A';
        } else {
            finalStatus = 'A';
        }

        finalReport.push({
            rollNo,
            status:         best.status,
            avgConfidence:  best.avgConfidence,
            confidenceZone: best.confidenceZone,
            firstSeenSec:   best.firstSeenSec,
            clusterFolder:  best.clusterFolder,
            finalStatus,
        });
    }

    return finalReport;
}

// ── Build summary counts ──────────────────────────────────────
function buildSummary(finalReport) {
    const total   = finalReport.length;
    const present = finalReport.filter(s => s.finalStatus === 'P').length;
    const absent  = finalReport.filter(s => s.finalStatus === 'A').length;
    const review  = finalReport.filter(s => s.finalStatus === 'R').length;
    return {
        totalStudents:  total,
        present,
        absent,
        review,
        attendancePct:  total > 0 ? Math.round((present / total) * 100) : 0,
    };
}

class AttendanceReportController {

    // ── Save / update report after ML processes a video ───────────
    // POST /attendancemodule/reports/save
    // Body: { batch, department, semester, subject, faculty, room, date,
    //         timeSlot, locksemId?, videoLink, mlResult }
    // mlResult shape: { attendance: {rollNo: {status,avg_confidence,...}},
    //                   summary: {present, absent, review, processing_time} }
    async saveReport(req, res) {
        try {
            const {
                batch, department, semester, subject, faculty, room,
                date, timeSlot, locksemId, videoLink, mlResult
            } = req.body;

            if (!batch || !date || !mlResult) {
                return res.status(400).json({ error: 'batch, date, and mlResult are required' });
            }

            // ── Build per-student list from ML result ──
            const students = [];
            const attendance = mlResult.attendance || {};
            for (const [rollNo, data] of Object.entries(attendance)) {
                students.push({
                    rollNo,
                    status:         data.status         || 'absent',
                    avgConfidence:  data.avg_confidence || 0,
                    confidenceZone: data.confidence_zone || 'low',
                    firstSeenSec:   data.first_seen_sec  || null,
                    clusterFolder:  data.cluster_folder  || null,
                    finalStatus:    data.status === 'present' ? 'P'
                                  : data.status === 'review'  ? 'R' : 'A',
                });
            }

            const slotResult = {
                slot:        timeSlot  || 'unknown',
                videoLink:   videoLink || '',
                processedAt: new Date(),
                students,
                summary: {
                    present:          mlResult.summary?.present          || 0,
                    absent:           mlResult.summary?.absent           || 0,
                    review:           mlResult.summary?.review           || 0,
                    total:            students.length,
                    processingTimeSec: mlResult.summary?.processing_time || 0,
                }
            };

            // ── Find existing report for same batch+date+timeSlot or create new ──
            let report = await AttendanceReport.findOne({ batch, date, timeSlot: timeSlot || '' });

            if (report) {
                // Append slot result (multiple videos for same session)
                report.slotResults.push(slotResult);
            } else {
                report = new AttendanceReport({
                    batch, department, semester, subject, faculty, room,
                    date, timeSlot: timeSlot || '',
                    locksemId: locksemId || null,
                    slotResults: [slotResult],
                    status: 'draft',
                });
            }

            // ── Recompute merged final report ──
            report.finalReport = mergeStudentStatus(report.slotResults);
            report.summary     = buildSummary(report.finalReport);

            await report.save();

            res.json({
                message:     'Report saved successfully',
                reportId:    report._id,
                summary:     report.summary,
                finalReport: report.finalReport,
            });
        } catch (err) {
            console.error('[AttendanceReport] saveReport error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ── List reports (with optional filters) ─────────────────────
    // GET /attendancemodule/reports?batch=X&date=X&faculty=X&status=X
    async getReports(req, res) {
        try {
            const { batch, date, faculty, subject, status, limit = 50, skip = 0 } = req.query;
            const filter = {};
            if (batch)   filter.batch   = batch;
            if (date)    filter.date    = date;
            if (faculty) filter.faculty = faculty;
            if (subject) filter.subject = subject;
            if (status)  filter.status  = status;

            const reports = await AttendanceReport
                .find(filter)
                .select('batch department semester subject faculty room date timeSlot summary status createdAt')
                .sort({ date: -1, createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit));

            const total = await AttendanceReport.countDocuments(filter);
            res.json({ reports, total, skip: Number(skip), limit: Number(limit) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Get full report detail ────────────────────────────────────
    // GET /attendancemodule/reports/:id
    async getReportById(req, res) {
        try {
            const report = await AttendanceReport.findById(req.params.id);
            if (!report) return res.status(404).json({ error: 'Report not found' });
            res.json(report);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Get reports by batch + date ───────────────────────────────
    // GET /attendancemodule/reports/by-date/:batch/:date
    async getReportByDate(req, res) {
        try {
            const { batch, date } = req.params;
            const reports = await AttendanceReport
                .find({ batch, date })
                .sort({ timeSlot: 1 });
            res.json({ batch, date, reports });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Get student history across all sessions ───────────────────
    // GET /attendancemodule/reports/student/:batch/:rollNo
    async getStudentHistory(req, res) {
        try {
            const { batch, rollNo } = req.params;

            const reports = await AttendanceReport
                .find({ batch, 'finalReport.rollNo': rollNo })
                .select('date timeSlot subject faculty finalReport summary')
                .sort({ date: -1 });

            const history = reports.map(r => {
                const entry = r.finalReport.find(s => s.rollNo === rollNo);
                return {
                    date:          r.date,
                    timeSlot:      r.timeSlot,
                    subject:       r.subject,
                    faculty:       r.faculty,
                    status:        entry?.status        || 'absent',
                    finalStatus:   entry?.finalStatus   || 'A',
                    avgConfidence: entry?.avgConfidence || 0,
                    reportId:      r._id,
                };
            });

            const totalSessions = history.length;
            const present       = history.filter(h => h.finalStatus === 'P').length;
            const attendancePct = totalSessions > 0
                ? Math.round((present / totalSessions) * 100) : 0;

            res.json({ batch, rollNo, history, totalSessions, present, attendancePct });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Finalize a report (draft → finalized) ─────────────────────
    // POST /attendancemodule/reports/:id/finalize
    async finalizeReport(req, res) {
        try {
            const report = await AttendanceReport.findById(req.params.id);
            if (!report) return res.status(404).json({ error: 'Report not found' });
            if (report.status === 'finalized') {
                return res.status(400).json({ error: 'Report is already finalized' });
            }
            report.status = 'finalized';
            await report.save();
            res.json({ message: 'Report finalized', reportId: report._id });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Update final status of a student manually ─────────────────
    // PATCH /attendancemodule/reports/:id/student/:rollNo
    // Body: { finalStatus: 'P' | 'A' | 'R' }
    async updateStudentStatus(req, res) {
        try {
            const { id, rollNo } = req.params;
            const { finalStatus } = req.body;

            if (!['P', 'A', 'R'].includes(finalStatus)) {
                return res.status(400).json({ error: 'finalStatus must be P, A, or R' });
            }

            const report = await AttendanceReport.findById(id);
            if (!report) return res.status(404).json({ error: 'Report not found' });
            if (report.status === 'finalized') {
                return res.status(400).json({ error: 'Cannot edit a finalized report' });
            }

            const student = report.finalReport.find(s => s.rollNo === rollNo);
            if (!student) return res.status(404).json({ error: 'Student not found in report' });

            student.finalStatus = finalStatus;
            report.summary = buildSummary(report.finalReport);
            await report.save();

            res.json({ message: `Updated ${rollNo} → ${finalStatus}`, summary: report.summary });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Delete a draft report ─────────────────────────────────────
    // DELETE /attendancemodule/reports/:id
    async deleteReport(req, res) {
        try {
            const report = await AttendanceReport.findById(req.params.id);
            if (!report) return res.status(404).json({ error: 'Report not found' });
            if (report.status === 'finalized') {
                return res.status(400).json({ error: 'Cannot delete a finalized report' });
            }
            await report.deleteOne();
            res.json({ message: 'Report deleted' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── Get locksem context (time slot + subject/faculty info) ─────
    // GET /attendancemodule/reports/locksem-context/:locksemId
    async getLocksemContext(req, res) {
        try {
            const locksem = await LockSem.findById(req.params.locksemId)
                .populate('timetable', 'name dept session');
            if (!locksem) return res.status(404).json({ error: 'LockSem entry not found' });
            res.json(locksem);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = AttendanceReportController;

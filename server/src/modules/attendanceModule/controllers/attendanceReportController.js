// server/src/modules/attendanceModule/controllers/attendanceReportController.js

const AttendanceReport = require("../../../models/attendanceReport");
const LockSem = require("../../../models/locksem");
const Student = require("../../../models/student");

function mergeStudentStatus(slotResults) {
  const rollMap = {};

  for (const slot of slotResults) {
    for (const s of slot.students) {
      if (!rollMap[s.rollNo]) rollMap[s.rollNo] = [];
      rollMap[s.rollNo].push({
        status: s.status,
        avgConfidence: s.avgConfidence || 0,
        confidenceZone: s.confidenceZone || "low",
        firstSeenSec: s.firstSeenSec,
        clusterFolder: s.clusterFolder,
        detectedAge: s.detectedAge ?? null,
        detectedGender: s.detectedGender ?? null,
        genderMismatch: s.genderMismatch || false,
        slot: slot.slot,
      });
    }
  }

  const finalReport = [];
  for (const [rollNo, entries] of Object.entries(rollMap)) {
    // Best = highest confidence across ALL runs (both cameras)
    const best = entries.reduce(
      (prev, cur) =>
        (cur.avgConfidence || 0) > (prev.avgConfidence || 0) ? cur : prev,
      entries[0],
    );

    const presentEntries = entries.filter((e) => e.status === "present");
    const reviewEntries = entries.filter((e) => e.status === "review");
    const allAbsent = entries.every((e) => e.status === "absent");

    let finalStatus;

    if (allAbsent) {
      // Absent in every run across every camera → definitely absent
      finalStatus = "A";
    } else if (presentEntries.length > 0) {
      // Present in at least one run — use best confidence to decide P vs R
      const bestPresent = presentEntries.reduce(
        (prev, cur) =>
          (cur.avgConfidence || 0) > (prev.avgConfidence || 0) ? cur : prev,
        presentEntries[0],
      );

      if (
        bestPresent.confidenceZone === "high" ||
        bestPresent.confidenceZone === "medium"
      ) {
        finalStatus = "P";
      } else {
        // Low confidence present — mark Review for manual check
        finalStatus = "R";
      }
    } else if (reviewEntries.length > 0) {
      // Only review statuses (no clear present) → keep as Review
      finalStatus = "R";
    } else {
      finalStatus = "A";
    }

    finalReport.push({
      rollNo,
      status: best.status,
      avgConfidence: best.avgConfidence,
      confidenceZone: best.confidenceZone,
      firstSeenSec: best.firstSeenSec,
      clusterFolder: best.clusterFolder,
      detectedAge: best.detectedAge,
      detectedGender: best.detectedGender,
      // If ANY slot flagged a mismatch, surface it on the final record —
      // a single confirmed mismatch is worth a manual look even if other
      // slots didn't detect a face clearly enough to compare.
      genderMismatch: entries.some((e) => e.genderMismatch),
      finalStatus,
      autoFinalStatus: finalStatus,
    });
  }

  return finalReport;
}

// Build summary counts
function buildSummary(finalReport) {
  const total = finalReport.length;
  const present = finalReport.filter((s) => s.finalStatus === "P").length;
  const absent = finalReport.filter((s) => s.finalStatus === "A").length;
  const review = finalReport.filter((s) => s.finalStatus === "R").length;
  return {
    totalStudents: total,
    present,
    absent,
    review,
    attendancePct: total > 0 ? Math.round((present / total) * 100) : 0,
  };
}
// Helper function: while saving attendance detects proxies
async function detectAndUpdateProxies(date, timeSlot) {
  // Get every report running during this slot
  const reports = await AttendanceReport.find({
    date,
    timeSlot,
  });

  // rollNo -> list of reports where student is present
  const studentMap = new Map();

  for (const report of reports) {
    for (const student of report.finalReport) {
      if (student.finalStatus !== "P") continue;
      if (!studentMap.has(student.rollNo)) {
        studentMap.set(student.rollNo, []);
      }
      studentMap.get(student.rollNo).push({
        reportId: report._id,
        room: report.room,
        subject: report.subject,
        faculty: report.faculty,
      });
    }
  }
  // reportId -> proxy entries
  const proxyMap = new Map();
  for (const report of reports) {
    proxyMap.set(report._id.toString(), []);
  }
  for (const [rollNo, appearances] of studentMap.entries()) {
    if (appearances.length <= 1) continue;
    for (const current of appearances) {
      const others = appearances.filter(
        (x) => x.reportId.toString() !== current.reportId.toString()
      );
      proxyMap.get(current.reportId.toString()).push({
        rollNo,
        otherReports: others,
      });
    }
  }

  // Update reports
  const updates = [];

  for (const report of reports) {
    const proxies = proxyMap.get(report._id.toString()) || [];

    report.proxyStudents = proxies;
    report.hasProxyStudents = proxies.length > 0;

    updates.push(report.save());
  }

  await Promise.all(updates);
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
        batch,
        department,
        semester,
        subject,
        faculty,
        room,
        date,
        timeSlot,
        locksemId,
        videoLink,
        mlResult,
        subjectMeta, 
      } = req.body;

      if (!batch || !date || !mlResult) {
        return res
          .status(400)
          .json({ error: "batch, date, and mlResult are required" });
      }

      const VALID_STATUSES = new Set([
        "present",
        "absent",
        "review",
        "not_enrolled",
      ]);

      // Build per-student list from ML result
      const students = [];
      const attendance = mlResult.attendance || {};

      // Bulk-fetch enrolled students' recorded gender for cross-checking
      // against what InsightFace detected during this session — avoids one
      // DB round-trip per student.
      const rollNos = Object.keys(attendance);
      const enrolledStudents = rollNos.length
        ? await Student.find({ rollNo: { $in: rollNos } }, { rollNo: 1, gender: 1 }).lean()
        : [];
      const recordedGenderByRoll = {};
      for (const s of enrolledStudents) {
        // Student.gender is "Male"/"Female"/"Other" — normalise to M/F to compare
        // against detectedGender ("M"/"F") from InsightFace's genderage head.
        if (s.gender?.toLowerCase() === "male")   recordedGenderByRoll[s.rollNo] = "M";
        else if (s.gender?.toLowerCase() === "female") recordedGenderByRoll[s.rollNo] = "F";
        // "Other" has no M/F equivalent — left unset, so genderMismatch stays false
      }

      for (const [rollNo, data] of Object.entries(attendance)) {
        const rawStatus = data.status || "absent";
        const status = VALID_STATUSES.has(rawStatus) ? rawStatus : "absent";

        const detectedGender = data.gender || null;   // "M" | "F" | null from ML
        const recordedGender = recordedGenderByRoll[rollNo];
        // Only flag a mismatch when both sides have a value to compare —
        // missing data (no detection, or "Other" on file) is never flagged.
        const genderMismatch = Boolean(
          detectedGender && recordedGender && detectedGender !== recordedGender
        );

        students.push({
          rollNo,
          status,
          avgConfidence: data.avg_confidence || 0,
          confidenceZone: data.confidence_zone || "low",
          firstSeenSec: data.first_seen_sec || null,
          clusterFolder: data.cluster_folder || null,
          detectedAge: data.age ?? null,
          detectedGender,
          genderMismatch,
          finalStatus:
            status === "present" ? "P" : status === "review" ? "R" : "A",
        });
      }

      const slotResult = {
        slot: timeSlot || "unknown",
        videoLink: videoLink || "",
        processedAt: new Date(),
        students,
        summary: {
          present: mlResult.summary?.present || 0,
          absent: mlResult.summary?.absent || 0,
          review: mlResult.summary?.review || 0,
          total: students.length,
          processingTimeSec: mlResult.summary?.processing_time || 0,
        },
      };

      // Upsert: ONE report per batch+date+timeSlot ──
      const slotKey = timeSlot || "";
      let report = await AttendanceReport.findOne({
        batch,
        date,
        timeSlot: slotKey,
      });

      if (report) {
        if (report.status === "finalized") {
          return res
            .status(409)
            .json({ error: "Cannot add runs to a finalized report" });
        }
        // Allow appending even if status is 'live' (session is running)
        report.slotResults.push(slotResult);
        if (subjectMeta) report.subjectMeta = subjectMeta;  
      } else {
        report = new AttendanceReport({
          batch,
          department,
          semester,
          subject,
          faculty,
          room,
          date,
          timeSlot: slotKey,
          locksemId: locksemId || null,
          subjectMeta: subjectMeta || undefined, 
          slotResults: [slotResult],
          status: "draft",
        });
      }

      // Always recompute merged final from ALL runs
      report.finalReport = mergeStudentStatus(report.slotResults);
      report.summary = buildSummary(report.finalReport);

      // If report was live (session), keep it live
      if (report.status !== "live") {
        report.status = "draft";
      }

      await report.save();
      // Check for possible proxies and save them in the report
      await detectAndUpdateProxies(report.date, report.timeSlot);

      res.json({
        message: "Report saved successfully",
        reportId: report._id,
        summary: report.summary,
        finalReport: report.finalReport,
      });
    } catch (err) {
      console.error("[AttendanceReport] saveReport error:", err);
      // Gracefully handle duplicate key race conditions
      if (err.code === 11000) {
        return res.status(409).json({
          error:
            "A report for this batch/date/slot already exists. Reload and try again.",
        });
      }
      res.status(500).json({ error: err.message });
    }
  }
  // List reports (with optional filters)
  // GET /attendancemodule/reports?batch=X&date=X&faculty=X&status=X
  async getReports(req, res) {
    try {
      const {
        batch,
        department,
        date,
        faculty,
        subject,
        status,
        limit = 50,
        skip = 0,
      } = req.query;
      const filter = {};
      if (batch) filter.batch = batch;
      if (department) {
        // Dept-admins pass their locked department; match case/space/underscore-insensitively
        const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const norm = escapeRegex(department.trim().replace(/\s+/g, '_'));
        filter.department = new RegExp(`^${norm.replace(/_/g, '[ _]')}$`, 'i');
      }
      if (date) filter.date = date;
      if (faculty) filter.faculty = faculty;
      if (subject) filter.subject = subject;
      if (status) filter.status = status;

      const reports = await AttendanceReport.find(filter)
        .select(
          "batch department semester subject faculty room date timeSlot summary status createdAt",
        )
        .sort({ date: -1, createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit));

      const total = await AttendanceReport.countDocuments(filter);
      res.json({ reports, total, skip: Number(skip), limit: Number(limit) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get full report detail
  // GET /attendancemodule/reports/:id
  async getReportById(req, res) {
    try {
      const report = await AttendanceReport.findById(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get reports by batch + date
  // GET /attendancemodule/reports/by-date/:batch/:date
  async getReportByDate(req, res) {
    try {
      const { batch, date } = req.params;
      const reports = await AttendanceReport.find({ batch, date }).sort({
        timeSlot: 1,
      });
      res.json({ batch, date, reports });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get student history across all sessions
  // GET /attendancemodule/reports/student/:batch/:rollNo
  async getStudentHistory(req, res) {
    try {
      const { batch, rollNo } = req.params;

      const reports = await AttendanceReport.find({
        batch,
        "finalReport.rollNo": rollNo,
      })
        .select("date timeSlot subject faculty finalReport summary")
        .sort({ date: -1 });

      const history = reports.map((r) => {
        const entry = r.finalReport.find((s) => s.rollNo === rollNo);
        return {
          date: r.date,
          timeSlot: r.timeSlot,
          subject: r.subject,
          faculty: r.faculty,
          status: entry?.status || "absent",
          finalStatus: entry?.finalStatus || "A",
          avgConfidence: entry?.avgConfidence || 0,
          detectedAge: entry?.detectedAge ?? null,
          detectedGender: entry?.detectedGender ?? null,
          genderMismatch: entry?.genderMismatch || false,
          reportId: r._id,
        };
      });

      const totalSessions = history.length;
      const present = history.filter((h) => h.finalStatus === "P").length;
      const attendancePct =
        totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

      res.json({
        batch,
        rollNo,
        history,
        totalSessions,
        present,
        attendancePct,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Finalize a report (draft → finalized)
  // POST /attendancemodule/reports/:id/finalize
  async finalizeReport(req, res) {
    try {
      const report = await AttendanceReport.findById(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      if (report.status === "finalized") {
        return res.status(400).json({ error: "Report is already finalized" });
      }
      report.status = "finalized";
      await report.save();
      res.json({ message: "Report finalized", reportId: report._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update final status of a student (called by ERP system or manually)
  // PATCH /attendancemodule/reports/:id/student/:rollNo
  // Body: { finalStatus: 'P' | 'A' | 'R', isOverridden?: boolean }
  async updateStudentStatus(req, res) {
    try {
      const { id, rollNo } = req.params;
      const { finalStatus, isOverridden } = req.body;

      if (!["P", "A", "R"].includes(finalStatus)) {
        return res
          .status(400)
          .json({ error: "finalStatus must be P, A, or R" });
      }

      const report = await AttendanceReport.findById(id);
      if (!report) return res.status(404).json({ error: "Report not found" });

      const student = report.finalReport.find((s) => s.rollNo === rollNo);
      if (!student)
        return res.status(404).json({ error: "Student not found in report" });

      student.finalStatus = finalStatus;
      if (isOverridden !== undefined) {
        student.isOverridden = Boolean(isOverridden);
      } else {
        student.isOverridden = true;
      }
      report.summary = buildSummary(report.finalReport);
      await report.save();

      res.json({
        message: `Updated ${rollNo} → ${finalStatus}`,
        summary: report.summary,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Delete a draft report
  // DELETE /attendancemodule/reports/:id
  async deleteReport(req, res) {
    try {
      const report = await AttendanceReport.findById(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      if (report.status === "finalized") {
        return res
          .status(400)
          .json({ error: "Cannot delete a finalized report" });
      }
      await report.deleteOne();
      res.json({ message: "Report deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get locksem context (time slot + subject/faculty info)
  // GET /attendancemodule/reports/locksem-context/:locksemId
  async getLocksemContext(req, res) {
    try {
      const locksem = await LockSem.findById(req.params.locksemId).populate(
        "timetable",
        "name dept session",
      );
      if (!locksem)
        return res.status(404).json({ error: "LockSem entry not found" });
      res.json(locksem);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /attendancemodule/reports/confidence-trend?batch=BTECH_ECE_2023
  async getConfidenceTrend(req, res) {
    try {
      const { batch } = req.query;
      if (!batch) return res.status(400).json({ error: "batch is required" });

      const now = new Date();
      const weekAgo = new Date(now);
      const days = parseInt(req.query.days) || 7;
      weekAgo.setDate(weekAgo.getDate() - days);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);

      // Fetch last 7 days reports for this batch
      const reports = await AttendanceReport.find({
        batch,
        date: { $gte: weekAgoStr },
      })
        .select("date finalReport semester")
        .sort({ date: 1 });

      // Group by rollNo → per day lowest confidence
      const studentMap = {};

      for (const report of reports) {
        for (const student of report.finalReport) {
          if (!studentMap[student.rollNo]) {
            studentMap[student.rollNo] = {
              days: {},
              semester: report.semester || "",
            };
          }
          const existing = studentMap[student.rollNo].days[report.date];
          const conf = student.avgConfidence || 0;
          if (existing === undefined || conf < existing) {
            studentMap[student.rollNo].days[report.date] = conf;
          }
        }
      }

      // Build result array with drift flag
      const result = Object.entries(studentMap).map(([rollNo, studentData]) => {
        const dayMap = studentData.days;
        const semester = studentData.semester;
        const days = Object.keys(dayMap).sort();
        const confidences = days.map((d) => ({
          date: d,
          confidence: dayMap[d],
        }));
        const isDrifting =
          confidences.length >= 2 &&
          confidences[confidences.length - 1].confidence <
            confidences[0].confidence;
        return { rollNo, semester, confidences, isDrifting };
      });

      // Sort — drifting students first
      result.sort((a, b) => b.isDrifting - a.isDrifting);

      // Get semester from the most recent report for this batch
      const semesterInfo =
        reports.length > 0 ? reports[reports.length - 1].semester : "";

      res.json({
        batch,
        weekFrom: weekAgoStr,
        semester: semesterInfo,
        students: result,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /attendancemodule/reports/model-performance?department=CSE&semester=3&days=30
  // Aggregates how often the model's original autoFinalStatus (captured once
  // at merge time, never overwritten) disagreed with the finalStatus a human
  // later corrected it to. Records with autoFinalStatus === null predate this
  // field and are skipped — there's no baseline to compare against.
  // Scoped by department + semester (not batch/year) — a department's
  // semester cohort is what the dashboard's audience (dept admins) actually
  // reasons about, and it matches the filter pattern already used by the
  // Attendance Reports history tab (see getReports()).
  async getModelPerformanceMetrics(req, res) {
    try {
      const { department, semester } = req.query;
      if (!department || !semester) {
        return res
          .status(400)
          .json({ error: "department and semester are required" });
      }

      const days = parseInt(req.query.days) || 30;
      const now = new Date();
      const fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - days);
      const fromStr = fromDate.toISOString().slice(0, 10);
      const toStr = now.toISOString().slice(0, 10);

      // Case/space/underscore-insensitive department match — same pattern
      // as getReports() above, since dept strings vary in casing/separator
      // between the timetable module and stored reports.
      const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const deptNorm = escapeRegex(department.trim().replace(/\s+/g, "_"));
      const deptRegex = new RegExp(`^${deptNorm.replace(/_/g, "[ _]")}$`, "i");

      const reports = await AttendanceReport.find({
        department: deptRegex,
        semester: String(semester),
        date: { $gte: fromStr },
      })
        .select("date department subject finalReport")
        .sort({ date: 1 });

      let total = 0;
      let overrides = 0;
      const disagreementMap = {}; // "P->A" -> count
      const bucketMap = {}; // "0.4-0.5" -> { total, overrides }
      const dayMap = {}; // date -> { total, overrides }
      const studentMap = {}; // rollNo -> { total, overrides }

      for (const report of reports) {
        for (const s of report.finalReport) {
          if (!s.autoFinalStatus) continue; // no baseline — pre-dashboard record

          total += 1;
          const changed = s.finalStatus !== s.autoFinalStatus;
          if (changed) overrides += 1;

          if (changed) {
            const key = `${s.autoFinalStatus}->${s.finalStatus}`;
            disagreementMap[key] = (disagreementMap[key] || 0) + 1;
          }

          const conf = Math.max(0, Math.min(1, s.avgConfidence || 0));
          const bucketStart = Math.min(9, Math.floor(conf * 10)) / 10;
          const bucketKey = `${bucketStart.toFixed(1)}-${(bucketStart + 0.1).toFixed(1)}`;
          if (!bucketMap[bucketKey]) bucketMap[bucketKey] = { total: 0, overrides: 0 };
          bucketMap[bucketKey].total += 1;
          if (changed) bucketMap[bucketKey].overrides += 1;

          if (!dayMap[report.date]) dayMap[report.date] = { total: 0, overrides: 0 };
          dayMap[report.date].total += 1;
          if (changed) dayMap[report.date].overrides += 1;

          if (!studentMap[s.rollNo]) studentMap[s.rollNo] = { total: 0, overrides: 0 };
          studentMap[s.rollNo].total += 1;
          if (changed) studentMap[s.rollNo].overrides += 1;
        }
      }

      const disagreementBreakdown = Object.entries(disagreementMap).map(
        ([key, count]) => {
          const [from, to] = key.split("->");
          return { from, to, count };
        },
      );

      const confidenceCalibration = Object.entries(bucketMap)
        .map(([bucket, v]) => ({
          bucket,
          total: v.total,
          agreementRate: v.total > 0 ? 1 - v.overrides / v.total : null,
        }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket));

      const trend = Object.entries(dayMap)
        .map(([date, v]) => ({
          date,
          total: v.total,
          overrideRate: v.total > 0 ? v.overrides / v.total : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topOverriddenStudents = Object.entries(studentMap)
        .map(([rollNo, v]) => ({
          rollNo,
          overrides: v.overrides,
          total: v.total,
          overrideRate: v.total > 0 ? v.overrides / v.total : 0,
        }))
        .filter((s) => s.overrides > 0)
        .sort((a, b) => b.overrides - a.overrides)
        .slice(0, 20);

      res.json({
        department,
        semester,
        from: fromStr,
        to: toStr,
        overall: {
          total,
          overrides,
          agreementRate: total > 0 ? 1 - overrides / total : null,
        },
        disagreementBreakdown,
        confidenceCalibration,
        trend,
        topOverriddenStudents,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /attendancemodule/reports/export?batch=X&mode=subject|semester&value=Y
  async exportAttendance(req, res) {
    try {
      const { batch, mode, value, fromDate, toDate } = req.query;
      if (!batch || !mode || !value) {
        return res
          .status(400)
          .json({ error: "batch, mode, and value are required" });
      }
      if (mode !== "subject" && mode !== "semester") {
        return res
          .status(400)
          .json({ error: "mode must be 'subject' or 'semester'" });
      }

      const filter = { batch };
      filter[mode] = value;

      if (fromDate || toDate) {
        filter.date = {};
        if (fromDate) filter.date.$gte = fromDate;
        if (toDate) filter.date.$lte = toDate;
      }

      const reports = await AttendanceReport.find(filter)
        .select("date subject semester finalReport")
        .sort({ date: 1 });

      if (reports.length === 0) {
        return res
          .status(404)
          .json({ error: "No reports found for this filter" });
      }

      const dateSet = new Set();
      const studentMap = {};

      for (const report of reports) {
        const dateStr = report.date;
        dateSet.add(dateStr);
        for (const student of report.finalReport) {
          if (!studentMap[student.rollNo]) {
            studentMap[student.rollNo] = {};
          }
          const existing = studentMap[student.rollNo][dateStr];
          if (!existing || (existing === "A" && student.finalStatus !== "A")) {
            studentMap[student.rollNo][dateStr] = student.finalStatus;
          }
        }
      }

      const dates = [...dateSet].sort();
      const rollNumbers = Object.keys(studentMap).sort();

      const header = ["Roll No", ...dates];
      const rows = rollNumbers.map((rollNo) => {
        const row = [rollNo];
        for (const d of dates) {
          row.push(studentMap[rollNo][d] || "-");
        }
        return row;
      });

      const format = req.query.format || "csv";

      if (format === "json") {
        return res.json({
          batch,
          mode,
          value,
          dates,
          rows: rollNumbers.map((rollNo) => ({
            rollNo,
            statuses: dates.map((d) => studentMap[rollNo][d] || "-"),
          })),
        });
      }

      const csvLines = [header.join(","), ...rows.map((r) => r.join(","))];
      const csvContent = csvLines.join("\n");

      const filename = `attendance_${mode}_${value.replace(/\s+/g, "_")}_${batch}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.send(csvContent);
    } catch (err) {
      console.error("[AttendanceReport] exportAttendance error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // GET /attendancemodule/reports/export-options?batch=X
  async getExportOptions(req, res) {
    try {
      const { batch } = req.query;
      if (!batch) return res.status(400).json({ error: "batch is required" });

      const [subjects, semesters, subjectFacultyDocs] = await Promise.all([
        AttendanceReport.distinct("subject", {
          batch,
          subject: { $nin: [null, ""] },
        }),
        AttendanceReport.distinct("semester", {
          batch,
          semester: { $nin: [null, ""] },
        }),
        AttendanceReport.find({ batch, subject: { $nin: [null, ""] } })
          .select("subject faculty")
          .lean(),
      ]);

      // Build subject -> faculty map (most recent faculty wins if subject taught by multiple)
      const subjectFacultyMap = {};
      for (const doc of subjectFacultyDocs) {
        if (doc.subject && doc.faculty) {
          subjectFacultyMap[doc.subject] = doc.faculty;
        }
      }

      res.json({
        subjects: subjects.sort(),
        semesters: semesters.sort(),
        subjectFaculty: subjectFacultyMap,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = AttendanceReportController;

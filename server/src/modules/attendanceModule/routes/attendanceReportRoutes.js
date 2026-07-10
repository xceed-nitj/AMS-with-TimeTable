// server/src/modules/attendanceModule/routes/attendanceReportRoutes.js

const express = require("express");
const router = express.Router();
const AttendanceReportController = require("../controllers/attendanceReportController");
const { attendanceRoleAccess, enforceAttendanceDepartment, requireDeptMenu } = require("../middleware/attendanceAccess");

const ctrl = new AttendanceReportController();

// Save report after ML processes a video
router.post("/save", ...attendanceRoleAccess, enforceAttendanceDepartment, async (req, res) => {
  try {
    await ctrl.saveReport(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List reports (filters via query: batch, date, faculty, subject, status)
router.get("/", ...attendanceRoleAccess, enforceAttendanceDepartment, async (req, res) => {
  try {
    await ctrl.getReports(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get reports for a batch on a specific date
router.get("/by-date/:batch/:date", ...attendanceRoleAccess, enforceAttendanceDepartment, async (req, res) => {
  try {
    await ctrl.getReportByDate(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get student attendance history across all sessions
router.get("/student/:batch/:rollNo", ...attendanceRoleAccess, enforceAttendanceDepartment, async (req, res) => {
  try {
    await ctrl.getStudentHistory(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get locksem context (subject / faculty / slot info)
router.get("/locksem-context/:locksemId", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.getLocksemContext(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Finalize a report
router.post("/:id/finalize", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.finalizeReport(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Manually override one student's final status.
// INTENTIONALLY LEFT UNAUTHENTICATED: this is called directly by the external
// ERP system (see updateStudentStatus's own comment in the controller), which
// has no browser session/JWT cookie to present. There's no API-key/service-auth
// mechanism in this codebase yet to gate it with instead — flagged as a known,
// deliberate exception during the attendance-module access lockdown, not an
// oversight. Revisit once the ERP integration can carry a shared-secret header.
router.patch("/:id/student/:rollNo", async (req, res) => {
  try {
    await ctrl.updateStudentStatus(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a draft report
router.delete("/:id", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.deleteReport(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Session management (multi-run attendance) ──────────────────────────────
const sessionCtrl = require("../controllers/attendanceSessionController");

// Start a multi-run session
router.post("/start-session", ...attendanceRoleAccess, enforceAttendanceDepartment, async (req, res) => {
  try {
    const result = await sessionCtrl.startSession(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Stop a running session
router.post("/stop-session/:reportId", ...attendanceRoleAccess, async (req, res) => {
  try {
    const result = await sessionCtrl.stopSession(req.params.reportId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get session status
router.get("/session-status/:reportId", ...attendanceRoleAccess, async (req, res) => {
  try {
    res.json(sessionCtrl.getSessionStatus(req.params.reportId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List all active sessions
router.get("/active-sessions", ...attendanceRoleAccess, async (req, res) => {
  try {
    res.json(sessionCtrl.listActiveSessions());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dashboard stats aggregate
router.get("/stats", ...attendanceRoleAccess, async (req, res) => {
  try {
    const AttendanceReport = require("../../../models/attendanceReport");
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);

    const [agg, recent] = await Promise.all([
      AttendanceReport.aggregate([
        {
          $facet: {
            total: [{ $count: "n" }],
            today: [{ $match: { date: todayStr } }, { $count: "n" }],
            thisWeek: [
              { $match: { date: { $gte: weekAgoStr } } },
              { $count: "n" },
            ],
            sums: [
              {
                $group: {
                  _id: null,
                  present: { $sum: "$summary.present" },
                  absent: { $sum: "$summary.absent" },
                  review: { $sum: "$summary.review" },
                  avgPct: { $avg: "$summary.attendancePct" },
                },
              },
            ],
          },
        },
      ]),
      AttendanceReport.find()
        .select(
          "batch room date timeSlot subject faculty summary status createdAt",
        )
        .sort({ date: -1, createdAt: -1 })
        .limit(8),
    ]);

    const f = agg[0];
    res.json({
      totalSessions: f.total[0]?.n ?? 0,
      todaySessions: f.today[0]?.n ?? 0,
      thisWeekSessions: f.thisWeek[0]?.n ?? 0,
      totalPresent: f.sums[0]?.present ?? 0,
      totalAbsent: f.sums[0]?.absent ?? 0,
      totalReview: f.sums[0]?.review ?? 0,
      avgAttendancePct:
        f.sums[0]?.avgPct != null ? Math.round(f.sums[0].avgPct) : null,
      recentReports: recent,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Chart data: dept-wise and day-wise attendance aggregates
router.get("/charts", ...attendanceRoleAccess, async (req, res) => {
  try {
    const AttendanceReport = require("../../../models/attendanceReport");
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const [deptAgg, dayAgg] = await Promise.all([
      AttendanceReport.aggregate([
        { $match: { department: { $exists: true, $ne: null, $ne: "" } } },
        {
          $group: {
            _id: "$department",
            present: { $sum: "$summary.present" },
            absent: { $sum: "$summary.absent" },
            avgPct: { $avg: "$summary.attendancePct" },
            count: { $sum: 1 },
          },
        },
        { $sort: { present: -1 } },
        { $limit: 10 },
      ]),
      AttendanceReport.aggregate([
        { $match: { date: { $exists: true } } },
        {
          $addFields: { dateObj: { $dateFromString: { dateString: "$date" } } },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$dateObj" },
            present: { $sum: "$summary.present" },
            absent: { $sum: "$summary.absent" },
            avgPct: { $avg: "$summary.attendancePct" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      byDept: deptAgg.map((d) => ({
        dept: d._id,
        present: d.present,
        absent: d.absent,
        avgPct: Math.round(d.avgPct || 0),
        count: d.count,
      })),
      byDay: dayAgg.map((d) => ({
        day: DAY_NAMES[(d._id - 1) % 7],
        present: d.present,
        absent: d.absent,
        avgPct: Math.round(d.avgPct || 0),
        count: d.count,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/confidence-trend", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.getConfidenceTrend(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/model-performance", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.getModelPerformanceMetrics(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get("/export", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.exportAttendance(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/export-options", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.getExportOptions(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /attendancemodule/reports/lookup-context?room=lt101&slot=period1&date=2026-04-08
router.get("/lookup-context", ...attendanceRoleAccess, async (req, res) => {
  try {
    const { room, slot, date } = req.query;
    if (!room || !slot)
      return res.status(400).json({ error: "room and slot required" });

    const LockSem = require("../../../models/locksem");
    const TimeTable = require("../../../models/timetable");

    // Get day-of-week from date (defaults to today)
    const d = date ? new Date(date) : new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const day = days[d.getDay()];

    // Find all locksem entries for this slot+day that have this room in slotData
    const entries = await LockSem.find({
      slot,
      day,
      "slotData.room": { $regex: new RegExp(`^${room.trim()}$`, "i") },
    }).populate("timetable", "name dept session degree sem");

    if (!entries.length) {
      return res.json({ found: false });
    }

    // Pick the first match and build context
    const entry = entries[0];
    const slotItem = entry.slotData.find(
      (s) => s.room?.toLowerCase().trim() === room.toLowerCase().trim(),
    );
    const tt = entry.timetable;

    // Sanitize dept name the same way the frontend does
    const sanitizedDept = (tt?.dept || "")
      .trim()
      .replace(/\s+/g, "_")
      .toUpperCase();
    const degree = tt?.degree || "BTECH";
    const sem = entry.sem || tt?.sem || "";

    // Derive year from sem (sem 1-2 → year 1, 3-4 → year 2, etc.)
    const semNum = parseInt(sem) || 0;
    const year =
      semNum > 0
        ? String(new Date().getFullYear() - Math.ceil(semNum / 2) + 1)
        : "";

    const batch = `${degree}_${sanitizedDept}_${year}`.toUpperCase();

    res.json({
      found: true,
      batch,
      subject: slotItem?.subject || "",
      faculty: slotItem?.faculty || "",
      semester: sem,
      department: sanitizedDept,
      degree,
      day,
      locksemId: entry._id,
    });
  } catch (err) {
    console.error("[lookup-context]", err);
    res.status(500).json({ error: err.message });
  }
});

// List reports with at least one manually/ERP-overridden student
// GET /attendancemodule/reports/erp-overrides?department=&batch=&from=&to=
router.get("/erp-overrides", ...attendanceRoleAccess, enforceAttendanceDepartment, requireDeptMenu('erpOverrides'), async (req, res) => {
  try {
    await ctrl.listOverriddenAttendance(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dept coordinator's verification remark for one overridden student.
// enforceAttendanceDepartment intentionally omitted — see updateCoordinatorRemark's
// own comment; department scoping is done inside the controller instead.
// PATCH /attendancemodule/reports/:id/student/:rollNo/coordinator-remark
router.patch("/:id/student/:rollNo/coordinator-remark", ...attendanceRoleAccess, requireDeptMenu('erpOverrides'), async (req, res) => {
  try {
    await ctrl.updateCoordinatorRemark(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get full report by ID (keep last to avoid conflicts with named routes above)
router.get("/:id", ...attendanceRoleAccess, async (req, res) => {
  try {
    await ctrl.getReportById(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

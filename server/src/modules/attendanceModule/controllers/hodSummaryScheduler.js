// hodSummaryScheduler.js
// Sends a daily-or-weekly attendance summary email to HODs (head/coordinator
// recipients, via the existing NotificationSettings recipient list), per the
// dailySummaryConfig controlled from the Email Notifications settings tab.
// Follows the same "register once at startup, fixed cron time" shape as
// frameCleanupScheduler.js / unknownFaceCleanupScheduler.js, rather than the
// per-minute loop in autoAttendanceScheduler.js (which is for per-period checks).

const cron = require("node-cron");
const AttendanceReport = require("../../../models/attendanceReport");
const NotificationSettings = require("../../../models/attendanceModule/notificationSettings");
const alertNotifier = require("./alertNotifier");

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// Monday..Friday date range (inclusive) for the week containing `d`
function currentWeekRange(d) {
  const day = d.getDay(); // 0=Sun..6=Sat
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { from: toDateStr(monday), to: toDateStr(friday) };
}

async function runDailySummaryCheck() {
  const settings = await NotificationSettings.getSettings();
  if (!settings.enabled || !settings.dailySummaryConfig?.enabled) return;

  const cfg = settings.dailySummaryConfig;
  const now = new Date();

  if (cfg.frequency === "weekly" && now.getDay() !== 5) return; // only fire on Friday

  const { from, to } =
    cfg.frequency === "weekly"
      ? currentWeekRange(now)
      : { from: toDateStr(now), to: toDateStr(now) };

  const reports = await AttendanceReport.find({ date: { $gte: from, $lte: to } })
    .select("department semester subject faculty room timeSlot summary")
    .lean();

  // One row per AttendanceReport doc — i.e. per date+timeSlot session — so a
  // subject taught multiple periods in the range appears as separate rows,
  // never averaged together.
  const byDept = {};
  for (const r of reports) {
    const dept = (r.department || "").trim();
    if (!dept) continue;
    const pct = r.summary?.attendancePct ?? 0;
    if (cfg.mode === "threshold" && pct >= cfg.threshold) continue;
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({
      semester: r.semester,
      subject: r.subject,
      faculty: r.faculty,
      room: r.room,
      period: r.timeSlot,
      present: r.summary?.present ?? 0,
      totalStudents: r.summary?.totalStudents ?? 0,
      attendancePct: pct,
    });
  }

  for (const [dept, rows] of Object.entries(byDept)) {
    if (rows.length === 0) continue;
    try {
      await alertNotifier.notifyDailySummary({
        dept,
        date: to,
        frequencyLabel: cfg.frequency,
        mode: cfg.mode,
        threshold: cfg.threshold,
        rows,
      });
    } catch (err) {
      console.error("[HodSummaryScheduler] Failed to send summary for", dept, ":", err.message);
    }
  }
}

/**
 * Register the daily cron job (call once at server startup).
 * Runs at 18:00 every day — the actual daily-vs-weekly and enabled/disabled
 * decision is re-read from NotificationSettings on every tick.
 */
function startHodSummaryScheduler() {
  cron.schedule("0 18 * * *", () => {
    runDailySummaryCheck().catch((err) =>
      console.error("[HodSummaryScheduler] Unhandled error:", err.message),
    );
  });
  console.log("[HodSummaryScheduler] Scheduler registered — runs daily at 18:00");
}

module.exports = { startHodSummaryScheduler, runDailySummaryCheck };

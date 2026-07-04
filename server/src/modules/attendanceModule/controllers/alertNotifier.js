const mailSender = require("../../mailsender");
const NotificationSettings = require("../../../models/attendanceModule/notificationSettings");
const templates = require("./emailTemplates");

const COOLDOWN_MS = 10 * 60 * 1000;
const lastSent = {};

function shouldSend(key) {
  const now = Date.now();
  const last = lastSent[key] || 0;
  if (now - last < COOLDOWN_MS) return false;
  lastSent[key] = now;
  return true;
}

// Get all emails that should receive this alertKey, filtered by role alertTypes + dept matching
function getRecipients(settings, alertKey, dept = null) {
  const emails = new Set();

  // Build a map of role → alertTypes for quick lookup
  const roleMap = {};
  for (const r of settings.roles) roleMap[r.role] = r.alertTypes;

  for (const recipient of settings.recipients) {
    const roleAlerts = roleMap[recipient.role];
    if (!roleAlerts || !roleAlerts[alertKey]) continue; // role not opted in

    if (recipient.role === 'admin') {
      emails.add(recipient.email);
    } else if (dept && (recipient.role === 'coordinator' || recipient.role === 'head')) {
      if (recipient.dept && recipient.dept.toLowerCase() === dept.toLowerCase()) {
        emails.add(recipient.email);
      }
    }
  }
  return [...emails];
}

async function sendAlert(subject, html, cooldownKey, alertKey, dept = null) {
  let settings;
  try {
    settings = await NotificationSettings.getSettings();
  } catch (err) {
    console.error("[AlertNotifier] Failed to load settings:", err.message);
    return;
  }

  if (!settings.enabled) return;

  const emails = getRecipients(settings, alertKey, dept);
  if (emails.length === 0) {
    console.warn("[AlertNotifier] No recipients for", alertKey, "— skipping");
    return;
  }

  if (cooldownKey && !shouldSend(cooldownKey)) return;

  for (const email of emails) {
    try {
      await mailSender(email, subject, html);
      console.log("[AlertNotifier] Sent:", subject, "→", email);
    } catch (err) {
      console.error("[AlertNotifier] Failed to send to", email, ":", err.message);
    }
  }
}

async function notifyServerDown(serviceName, details = "") {
  await sendAlert(
    `⚠️ iAMS Alert: ${serviceName} is down`,
    templates.serverDownTemplate(serviceName, details),
    null, "serverDown", null
  );
}

async function notifyNoReportSaved({ batch, subject, faculty, room, date, timeSlot, dept }) {
  await sendAlert(
    `⚠️ iAMS Alert: No report saved — ${subject || "Unknown subject"}`,
    templates.noReportSavedTemplate({ batch, subject, faculty, room, date, timeSlot }),
    `no-report-${batch}-${date}-${timeSlot}`,
    "noReportSaved", dept || null
  );
}

async function notifyClassBunk({ batch, subject, faculty, room, date, timeSlot, dept, totalStudents }) {
  await sendAlert(
    `🚨 iAMS Alert: Class bunked — ${subject || "Unknown subject"}`,
    templates.classBunkTemplate({ batch, subject, faculty, room, date, timeSlot, totalStudents }),
    `class-bunk-${batch}-${date}-${timeSlot}`,
    "classBunk", dept || null
  );
}

async function notifyLowConfidence({ batch, rollNo, avgConfidence, dept }) {
  await sendAlert(
    `⚠️ iAMS Alert: Low confidence detection — ${rollNo}`,
    templates.lowConfidenceTemplate({ batch, rollNo, avgConfidence }),
    `low-conf-${batch}-${rollNo}`,
    "lowConfidence", dept || null
  );
}

async function notifyDuplicateAttendance({ rollNo, date, sessions }) {
  await sendAlert(
    `⚠️ iAMS Alert: Duplicate attendance detected — ${rollNo}`,
    templates.duplicateAttendanceTemplate({ rollNo, date, sessions }),
    `dup-${rollNo}-${date}`,
    "duplicateAttendance", null
  );
}

async function notifyDailySummary({ dept, date, frequencyLabel, mode, threshold, rows }) {
  await sendAlert(
    `📊 iAMS ${frequencyLabel === "weekly" ? "Weekly" : "Daily"} Attendance Summary — ${dept}`,
    templates.dailySummaryTemplate({ dept, date, frequencyLabel, mode, threshold, rows }),
    null, "dailySummary", dept || null
  );
}

module.exports = {
  notifyServerDown,
  notifyNoReportSaved,
  notifyClassBunk,
  notifyLowConfidence,
  notifyDuplicateAttendance,
  notifyDailySummary,
};

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

// alertKey must match one of: serverDown | lowConfidence | classBunk | duplicateAttendance
function getRecipients(recipients, alertKey, dept = null) {
  const emails = new Set();
  for (const r of recipients) {
    if (!r.alertTypes || !r.alertTypes[alertKey]) continue; // must be opted in for this alert type

    if (r.category === "admin") {
      emails.add(r.email);
    } else if (dept && (r.category === "coordinator" || r.category === "head")) {
      if (r.dept && r.dept.toLowerCase() === dept.toLowerCase()) {
        emails.add(r.email);
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

  const emails = getRecipients(settings.recipients, alertKey, dept);
  if (emails.length === 0) {
    console.warn("[AlertNotifier] No recipients opted in for", alertKey, "— skipping:", subject);
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
  const subject = `⚠️ iAMS Alert: ${serviceName} is down`;
  await sendAlert(subject, templates.serverDownTemplate(serviceName, details), null, "serverDown", null);
}

async function notifyClassBunk({ batch, subject, faculty, room, date, timeSlot, dept }) {
  const emailSubject = `⚠️ iAMS Alert: Class bunked — ${subject || "Unknown subject"}`;
  await sendAlert(
    emailSubject,
    templates.classBunkTemplate({ batch, subject, faculty, room, date, timeSlot }),
    `class-bunk-${batch}-${date}-${timeSlot}`,
    "classBunk",
    dept || null
  );
}

async function notifyLowConfidence({ batch, rollNo, avgConfidence, dept }) {
  const subject = `⚠️ iAMS Alert: Low confidence detection — ${rollNo}`;
  await sendAlert(
    subject,
    templates.lowConfidenceTemplate({ batch, rollNo, avgConfidence }),
    `low-conf-${batch}-${rollNo}`,
    "lowConfidence",
    dept || null
  );
}

async function notifyDuplicateAttendance({ rollNo, date, sessions }) {
  const subject = `⚠️ iAMS Alert: Duplicate attendance detected — ${rollNo}`;
  await sendAlert(
    subject,
    templates.duplicateAttendanceTemplate({ rollNo, date, sessions }),
    `dup-${rollNo}-${date}`,
    "duplicateAttendance",
    null
  );
}

module.exports = {
  notifyServerDown,
  notifyClassBunk,
  notifyLowConfidence,
  notifyDuplicateAttendance,
};

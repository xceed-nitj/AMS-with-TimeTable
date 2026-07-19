// server/src/modules/attendanceModule/controllers/timeWindowGuard.js
//
// Enforces the optional 08:30–17:30 IST window on Ground Truth acquisition
// and Attendance runs. Backed by the OtherControlsSettings singleton — when
// the relevant toggle is OFF (the default), the action is always allowed.
//
// IST is computed independently of the server timezone via Intl (same
// approach as deptAdminController.getCampusDate), so this holds whether the
// host runs in UTC, IST, or anything else.

const OtherControlsSettings = require("../../../models/attendanceModule/otherControlsSettings");

// Current minutes-of-day (0–1439) in Asia/Kolkata.
function nowMinIST() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  // "24:00" can appear at midnight in some engines — normalise to 0.
  return ((h % 24) * 60 + m) % (24 * 60);
}

function timeStrToMin(hhmm, fallback) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return fallback;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  return h * 60 + m;
}

// Is the current IST time inside [windowStart, windowEnd] (inclusive)?
function isWithinWindow(settings) {
  const startMin = timeStrToMin(settings?.windowStart, 510); // 08:30
  const endMin = timeStrToMin(settings?.windowEnd, 1050); // 17:30
  const cur = nowMinIST();
  return cur >= startMin && cur <= endMin;
}

function windowLabel(settings) {
  return `${settings?.windowStart || "08:30"}–${settings?.windowEnd || "17:30"} IST`;
}

// { allowed: boolean, reason: string } — reason is set only when blocked.
async function checkGroundTruthAllowed() {
  const settings = await OtherControlsSettings.getSettings();
  if (!settings.groundTruthTimeWindowEnabled) return { allowed: true, reason: "" };
  if (isWithinWindow(settings)) return { allowed: true, reason: "" };
  return {
    allowed: false,
    reason: `Ground Truth acquisition is restricted to ${windowLabel(settings)}.`,
  };
}

async function checkAttendanceRunAllowed() {
  const settings = await OtherControlsSettings.getSettings();
  if (!settings.attendanceRunTimeWindowEnabled) return { allowed: true, reason: "" };
  if (isWithinWindow(settings)) return { allowed: true, reason: "" };
  return {
    allowed: false,
    reason: `Attendance runs are restricted to ${windowLabel(settings)}.`,
  };
}

module.exports = {
  nowMinIST,
  isWithinWindow,
  checkGroundTruthAllowed,
  checkAttendanceRunAllowed,
};

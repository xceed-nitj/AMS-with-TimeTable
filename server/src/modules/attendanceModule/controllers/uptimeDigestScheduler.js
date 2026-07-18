// uptimeDigestScheduler.js
// Scheduled uptime check for the four iAMS-facing services — Client
// (frontend), Node server (public URL), ERP server, and the H100 ML service.
// Fires twice a day at 08:30 and 13:30 IST on working days (Mon–Fri) and
// sends ONE consolidated "Server Down" email listing every probed service
// when at least one of them is unreachable. All services up → no email.
//
// This is deliberately a DIFFERENT mechanism from the existing mailers:
// healthRoutes.js is edge-triggered (polls every 30s, mails only on down↔up
// transitions for ML and ERP), whereas this is schedule-triggered — a fixed
// twice-daily snapshot independent of transitions. Only the serverDown
// recipient opt-in (NotificationSettings) and SMTP transport are shared.
// Follows the "register once at startup, fixed cron time" shape of
// hodSummaryScheduler.js.

const cron = require("node-cron");
const axios = require("axios");
const mlClient = require("./mlServiceClient");
const alertNotifier = require("./alertNotifier");
const { erpConfigured, ERP_API_URL } = require("./erpSyncController");
const Allotment = require("../../../models/allotment");

// Deploy-specific probe targets. The Node server URL is probed over its
// public address (not a self-check) so DNS/proxy/tunnel failures count as
// down even though this process is the one running the probe.
const CLIENT_HEALTH_URL = process.env.CLIENT_HEALTH_URL;
const SERVER_HEALTH_URL = process.env.SERVER_HEALTH_URL;

const PROBE_TIMEOUT_MS = 8000;

// Checks the Allotment model for non-working days.
// Replaces the old hardcoded Sat/Sun check because weekends are explicitly
// configured as non-working days in the UI when needed.
async function isWorkingDay(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateString = formatter.format(date);

  try {
    const allotmentEntry = await Allotment.findOne({ "nonWorkingDays.date": dateString }).lean();
    return !allotmentEntry; // True if no entry is found (it's a working day)
  } catch (err) {
    console.error("[UptimeDigest] Error checking working day:", err.message);
    return false; // Fail safe
  }
}

// Reachability probe, same semantics as healthRoutes.js's ERP check: any
// HTTP response (even 404/401) means the service answered, so it counts as
// up; only a network-level failure (timeout, DNS, refused) counts as down.
async function probeUrl(name, url) {
  try {
    await axios.get(url, { timeout: PROBE_TIMEOUT_MS, validateStatus: () => true });
    return { name, target: url, status: "up", error: "" };
  } catch (err) {
    return { name, target: url, status: "down", error: err.message };
  }
}

async function probeErp() {
  if (!erpConfigured()) {
    return { name: "ERP Server", target: "", status: "not_configured", error: "" };
  }
  return probeUrl("ERP Server", ERP_API_URL);
}

// The ML service needs a real 200 from /health (a reverse proxy answering
// with 502 while the GPU box is dead must not count as up), so it goes
// through mlClient.healthCheck() rather than the reachability probe.
async function probeMl() {
  const target = mlClient.getTargetInfo();
  const name = target.kind === "h100" ? "H100 ML Server" : `${target.label}`;
  try {
    await mlClient.healthCheck();
    return { name, target: target.display, status: "up", error: "" };
  } catch (err) {
    return { name, target: target.display, status: "down", error: err.message };
  }
}

async function runUptimeDigestCheck() {
  const results = await Promise.all([
    probeUrl("Client (frontend)", CLIENT_HEALTH_URL),
    probeUrl("Node Server", SERVER_HEALTH_URL),
    probeErp(),
    probeMl(),
  ]);

  const down = results.filter((r) => r.status === "down");
  if (down.length === 0) {
    console.log("[UptimeDigest] All services reachable — no email sent.");
    return { results, sent: false };
  }

  console.warn("[UptimeDigest] Down:", down.map((r) => r.name).join(", "));
  await alertNotifier.notifyUptimeDigest({ results });
  return { results, sent: true };
}

/**
 * Register the two cron jobs (call once at server startup).
 * 08:30 and 13:30 Monday–Friday, pinned to IST so the times hold regardless
 * of the deploy host's locale.
 */
function startUptimeDigestScheduler() {
  const tick = async () => {
    try {
      const working = await isWorkingDay();
      if (!working) {
        console.log("[UptimeDigest] Non-working day — check skipped.");
        return;
      }
      await runUptimeDigestCheck();
    } catch (err) {
      console.error("[UptimeDigest] Unhandled error:", err.message);
    }
  };
  cron.schedule("30 8 * * *", tick, { timezone: "Asia/Kolkata" });
  cron.schedule("30 13 * * *", tick, { timezone: "Asia/Kolkata" });
  console.log("[UptimeDigest] Scheduler registered — 08:30 & 13:30 IST on working days.");
}

module.exports = { startUptimeDigestScheduler, runUptimeDigestCheck, isWorkingDay };

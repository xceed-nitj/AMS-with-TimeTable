const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const axios = require("axios");
const mlClient = require("../controllers/mlServiceClient");
const alertNotifier = require("../controllers/alertNotifier");
const nodeLogBuffer = require("../../../nodeLogBuffer");
const { erpConfigured, ERP_API_URL } = require("../controllers/erpSyncController");

let prevMlStatus = "online";
let mlAlertInProgress = false;
let prevErpStatus = "online";
let erpAlertInProgress = false;
async function getHealthStatus() {
  const mlTarget = mlClient.getTargetInfo();
  const response = {
    timestamp: new Date().toISOString(),
    services: {
      server: {
        status: "online",
        uptime: Math.floor(process.uptime()),
      },
      database: {
        status: "offline",
      },
      ml: {
        status: "offline",
        latency: null,
        target: mlTarget,
      },
      tunnel: {
        status: mlTarget.kind === "h100" ? "checking" : "not_configured",
        target: mlTarget,
      },
      erp: {
        status: "not_configured",
        latency: null,
      },
    },
  };

  // Database check
  if (mongoose.connection.readyState === 1) {
    response.services.database.status = "online";
  }

  // ML Service check
  const mlStart = Date.now();
  try {
    const mlHealth = await mlClient.healthCheck();
    response.services.ml.status = "online";
    prevMlStatus = "online";
    response.services.ml.latency = Date.now() - mlStart;
    // Per-model ONNX/index availability on the ML machine (H100) — surfaced
    // in the frontend's ML and H100 health dropdowns. See ml_service.py
    // /health's "models" block.
    response.services.ml.models = mlHealth.models || null;
    response.services.ml.activeDetector = mlHealth.active_detector || null;
    response.services.ml.studentsEnrolled = mlHealth.students_enrolled ?? null;
    response.services.tunnel.status =
      mlTarget.kind === "h100" ? "online" : "not_configured";
  } catch (error) {
    response.services.ml.status = "offline";
    response.services.tunnel.status =
      mlTarget.kind === "h100" ? "offline" : "not_configured";
    if (prevMlStatus === "online" && !mlAlertInProgress) {
      mlAlertInProgress = true;
      prevMlStatus = "offline";
      await alertNotifier.notifyServerDown("ML Service", error.message);
      mlAlertInProgress = false;
    }
  }

  // ERP reachability check — a plain HTTP reachability probe, not an
  // auth/data check. Any HTTP response (even 404/401) means the ERP server
  // process answered, so it counts as online; only a network-level failure
  // (timeout, DNS, connection refused) counts as offline.
  if (erpConfigured()) {
    const erpStart = Date.now();
    try {
      await axios.get(ERP_API_URL, { timeout: 5000, validateStatus: () => true });
      response.services.erp.status = "online";
      response.services.erp.latency = Date.now() - erpStart;
      prevErpStatus = "online";
    } catch (error) {
      response.services.erp.status = "offline";
      if (prevErpStatus === "online" && !erpAlertInProgress) {
        erpAlertInProgress = true;
        prevErpStatus = "offline";
        await alertNotifier.notifyErpDown(error.message);
        erpAlertInProgress = false;
      }
    }
  }

  return response;
}

router.get("/status", async (req, res) => {
  res.json(await getHealthStatus());
});

// Node's own console output, mirroring the Python ML service's /logs endpoint
router.get("/node-logs", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 200;
  res.json(nodeLogBuffer.getLogs(limit));
});

// Stream endpoint for real-time auto-updates via SSE
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Initial push
  getHealthStatus().then((status) => {
    res.write(`data: ${JSON.stringify(status)}\n\n`);
  });

  // Poll every 2 seconds and push updates
  const intervalId = setInterval(async () => {
    const status = await getHealthStatus();
    res.write(`data: ${JSON.stringify(status)}\n\n`);
  }, 2000);

  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});

// Background health monitor (skipped under test — module-load timers leak
// into test runners; unref'd so it never keeps the process alive on its own)
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    getHealthStatus().catch((err) =>
      console.error("[HealthMonitor] check failed:", err.message),
    );
  }, 30 * 1000).unref();
}

module.exports = router;

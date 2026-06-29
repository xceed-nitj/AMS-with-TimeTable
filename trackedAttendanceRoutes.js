// server/src/routes.js             add lines at end
// const trackedAttendanceRoutes = require("./modules/attendanceModule/routes/trackedAttendanceRoutes");
// v1router.use("/ml", trackedAttendanceRoutes);

// module.exports = v1router;

// most prob place to put acc to me server/src/modules/attendanceModule/routes/trackedAttendanceRoutes.js



// trackedAttendanceRoutes.js
//
// NEW FILE — Node/Express proxy for the new Python endpoint
// POST /run-attendance-rtsp-tracked (tracked_routes.py).
//
// This mirrors however your existing /run-attendance-rtsp proxy route talks
// to ml_service.py: it forwards the SSE stream byte-for-byte to the browser
// so the EventSource on the frontend just works, the same way it already
// does for the existing tracked-less attendance run.
//
// Mount this in your main Express app (one new line, no existing route
// file is touched):
//   const trackedAttendanceRoutes = require("./routes/trackedAttendanceRoutes");
//   app.use("/api", trackedAttendanceRoutes);
//
// Adjust ML_SERVICE_URL to match however your existing routes reach
// ml_service.py (env var, config file, etc.) — defaulted here to the same
// host:port the rest of this service already assumes (8500).

const express = require("express");
const axios   = require("axios");

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8500";

// POST /api/run-attendance-rtsp-tracked
// Body: { rtspUrl, frameSkip, durationSec, recogThreshold, iouMin,
//         driftThresholdPx, trackExpirySec, enrolledRollNos }
// Streams Server-Sent Events straight through to the browser.
router.post("/run-attendance-rtsp-tracked", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let upstream;
  try {
    upstream = await axios.post(
      `${ML_SERVICE_URL}/run-attendance-rtsp-tracked`,
      req.body,
      { responseType: "stream", timeout: 0 }
    );
  } catch (err) {
    const detail =
      err.response?.data?.detail || err.message || "Failed to reach ML service";
    res.write(`data: ${JSON.stringify({ type: "error", message: detail })}\n\n`);
    return res.end();
  }

  upstream.data.pipe(res);

  // If the browser disconnects, ask the ML service to stop via its
  // existing /stop-rtsp-stream route — tracked_routes.py reuses that
  // same job registry, so this works for tracked jobs too.
  let jobId = null;
  upstream.data.on("data", (chunk) => {
    const text = chunk.toString();
    const m = text.match(/"type":\s*"job_id",\s*"jobId":\s*"([^"]+)"/);
    if (m) jobId = m[1];
  });

  req.on("close", () => {
    if (jobId) {
      axios
        .post(`${ML_SERVICE_URL}/stop-rtsp-stream`, { jobId })
        .catch(() => {});
    }
  });
});

// POST /api/stop-tracked-attendance
// Convenience explicit-stop endpoint (in addition to the close-handler
// above), forwarding to the same existing /stop-rtsp-stream route.
router.post("/stop-tracked-attendance", async (req, res) => {
  try {
    const r = await axios.post(`${ML_SERVICE_URL}/stop-rtsp-stream`, {
      jobId: req.body.jobId || "",
    });
    res.json(r.data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;

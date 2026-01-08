const express = require("express");
const router = express.Router();
const LogsController = require("../controllers/logs");
const logsController = new LogsController();
const protectRoute = require("../../usermanagement/privateroute");

router.get("/get", protectRoute, async (req, res) => {
  try {
    await logsController.getLogs(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/total", protectRoute, async (req, res) => {
  try {
    await logsController.getTotalLogs(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;
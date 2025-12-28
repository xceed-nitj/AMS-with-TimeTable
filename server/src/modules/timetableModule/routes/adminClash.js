const express = require("express");
const router = express.Router();
const AdminClashController = require("../controllers/adminClashController");
const adminClashController = new AdminClashController();

/**
 * Get all clashes across all departments for a session
 * @route GET /timetablemodule/adminclash/:session
 */
router.get("/:session", async (req, res) => {
  try {
    console.log('Route hit: GET /adminclash/:session', req.params.session);
    await adminClashController.getAllClashes(req, res);
  } catch (e) {
    console.error("Error in getAllClashes route:", e);
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

/**
 * Get clash summary statistics for a session
 * @route GET /timetablemodule/adminclash/:session/summary
 */
router.get("/:session/summary", async (req, res) => {
  try {
    console.log('Route hit: GET /adminclash/:session/summary', req.params.session);
    await adminClashController.getClashSummary(req, res);
  } catch (e) {
    console.error("Error in getClashSummary route:", e);
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

/**
 * Get clashes for a specific department
 * @route GET /timetablemodule/adminclash/department/:code
 */
router.get("/department/:code", async (req, res) => {
  try {
    console.log('Route hit: GET /adminclash/department/:code', req.params.code);
    await adminClashController.getDepartmentClashes(req, res);
  } catch (e) {
    console.error("Error in getDepartmentClashes route:", e);
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;
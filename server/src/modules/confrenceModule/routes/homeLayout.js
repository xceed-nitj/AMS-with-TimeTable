const express = require("express");
const HomeLayoutController = require("../crud/homeLayout");
const { checkRole } = require("../../checkRole.middleware");

const router = express.Router();
const homeLayoutController = new HomeLayoutController();

// Unauthenticated: consumed by the external conference-site frontend to
// decide which home-page sections to render and in what order.
router.get("/public/:confId", async (req, res) => {
  try {
    const layout = await homeLayoutController.getLayout(req.params.confId);
    res.status(200).json(layout);
  } catch (e) {
    console.error("Error retrieving public home layout:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

// Admin panel: same merged layout.
router.get("/:confId", async (req, res) => {
  try {
    const layout = await homeLayoutController.getLayout(req.params.confId);
    res.status(200).json(layout);
  } catch (e) {
    console.error("Error retrieving home layout:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:confId", checkRole(["EO"]), async (req, res) => {
  try {
    const layout = await homeLayoutController.saveLayout(req.params.confId, req.body?.sections);
    res.status(200).json(layout);
  } catch (e) {
    console.error("Error saving home layout:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

module.exports = router;

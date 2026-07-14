const express = require("express");
const HomeCustomisationController = require("../crud/homeCustomisation");
const { checkRole } = require("../../checkRole.middleware");

const router = express.Router();
const homeCustomisationController = new HomeCustomisationController();

// Unauthenticated: consumed by the external conference-site frontend to
// decide which design variant to render for each home-page component.
router.get("/public/:confId", async (req, res) => {
  try {
    const customisation = await homeCustomisationController.getCustomisation(req.params.confId);
    res.status(200).json(customisation);
  } catch (e) {
    console.error("Error retrieving public home customisation:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

// Admin panel: same merged customisation.
router.get("/:confId", async (req, res) => {
  try {
    const customisation = await homeCustomisationController.getCustomisation(req.params.confId);
    res.status(200).json(customisation);
  } catch (e) {
    console.error("Error retrieving home customisation:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:confId", checkRole(["EO"]), async (req, res) => {
  try {
    const customisation = await homeCustomisationController.saveCustomisation(req.params.confId, req.body?.components);
    res.status(200).json(customisation);
  } catch (e) {
    console.error("Error saving home customisation:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

module.exports = router;

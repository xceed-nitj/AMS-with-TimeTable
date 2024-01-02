const express = require("express");
const SponsorsController = require("../crud/sponsors");

const sponsorsRouter = express.Router();
const sponsorsController = new SponsorsController();

// GET /sponsors/conference/:id
sponsorsRouter.get("/conference/:id", async (req, res) => {
  try {
    await sponsorsController.getSponsorsByConferenceId(req, res);
  } catch (e) {
    console.error("Error getting sponsors by conference ID:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

// GET /sponsors
sponsorsRouter.get("/", async (req, res) => {
  try {
    await sponsorsController.getAllSponsors(req, res);
  } catch (e) {
    console.error("Error getting all sponsors:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

// GET /sponsors/:id
sponsorsRouter.get("/:id", async (req, res) => {
  try {
    await sponsorsController.getSponsorById(req, res);
  } catch (e) {
    console.error("Error getting sponsor by ID:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

// POST /sponsors
sponsorsRouter.post("/", async (req, res) => {
  try {
    await sponsorsController.createSponsor(req, res);
  } catch (e) {
    console.error("Error creating sponsor:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

// PUT /sponsors/:id
sponsorsRouter.put("/:id", async (req, res) => {
  try {
    await sponsorsController.updateSponsor(req, res);
  } catch (e) {
    console.error("Error updating sponsor:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

// DELETE /sponsors/:id
sponsorsRouter.delete("/:id", async (req, res) => {
  try {
    await sponsorsController.deleteSponsor(req, res);
  } catch (e) {
    console.error("Error deleting sponsor:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

module.exports = sponsorsRouter;

const express = require("express");
const AwardsController = require("../crud/awards"); // Change to the appropriate awards controller

const awardsRouter = express.Router();
const awardsController = new AwardsController();
const { checkRole } = require("../../checkRole.middleware");

// GET /awards/conference/:id
awardsRouter.get("/conference/:id", async (req, res) => {
  try {
    await awardsController.getAwardsByConferenceId(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /awards
awardsRouter.get("/", async (req, res) => {
  try {
    await awardsController.getAllAwards(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /awards/:id
awardsRouter.get("/:id", async (req, res) => {
  try {
    await awardsController.getAwardById(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /awards
awardsRouter.post("/",checkRole(['EO']), async (req, res) => {
  try {
    await awardsController.createAward(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /awards/:id
awardsRouter.put("/:id", async (req, res) => {
  try {
    await awardsController.updateAward(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /awards/:id
awardsRouter.delete("/:id", checkRole(['EO']),async (req, res) => {
  try {
    await awardsController.deleteAward(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = awardsRouter;

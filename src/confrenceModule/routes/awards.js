const express = require("express");
const AwardsController = require("../crud/awards");

const awardsRouter = express.Router();
const awardsController = new AwardsController();

// GET /awards/conference/:id
awardsRouter.get("/conference/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const awards = await awardsController.getAwardsByConferenceId(id);
    res.status(200).json(awards);
  } catch (error) {
    console.error("Error fetching awards:", error);
    res
      .status(error?.code || 500)
      .json({ error: error?.meta?.cause || "Internal Server Error" });
  }
});

// GET /awards
awardsRouter.get("/", async (req, res) => {
  try {
    const allAwards = await awardsController.getAllAwards();
    res.status(200).json(allAwards);
  } catch (error) {
    console.error("Error fetching all awards:", error);
    res
      .status(error?.code || 500)
      .json({ error: error?.meta?.cause || "Internal Server Error" });
  }
});

// GET /awards/:id
awardsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const award = await awardsController.getAwardById(id);
    res.status(200).json(award);
  } catch (error) {
    console.error("Error fetching award:", error);
    res
      .status(error?.code || 500)
      .json({ error: error?.meta?.cause || "Internal Server Error" });
  }
});

// POST /awards
awardsRouter.post("/", async (req, res) => {
  try {
    const newAward = req.body;
    const award = await awardsController.createAward(newAward);
    res.status(201).json(award);
  } catch (error) {
    console.error("Error creating award:", error);
    res
      .status(error?.code || 500)
      .json({ error: error?.meta?.cause || "Internal Server Error" });
  }
});

// PUT /awards/:id
awardsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAward = req.body;
    const award = await awardsController.updateAward(id, updatedAward);
    res.status(200).json(award);
  } catch (error) {
    console.error("Error updating award:", error);
    res
      .status(error?.code || 500)
      .json({ error: error?.meta?.cause || "Internal Server Error" });
  }
});

// DELETE /awards/:id
awardsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await awardsController.deleteAward(id);
    res.status(200).json({ message: "Award deleted successfully" });
  } catch (error) {
    console.error("Error deleting award:", error);
    res
      .status(error?.code || 500)
      .json({ error: error?.meta?.cause || "Internal Server Error" });
  }
});

module.exports = awardsRouter;

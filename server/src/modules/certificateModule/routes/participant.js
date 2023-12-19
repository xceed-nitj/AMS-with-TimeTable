const express = require("express");
const participantRouter = express.Router();
// const ParticipantController = require("../controllers/participantController");
// const participantController = new ParticipantController();

// Route to create a new participant
participantRouter.post("/", async (req, res) => {
  try {
    await participantController.createParticipant(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all participants
participantRouter.get("/", async (req, res) => {
  try {
    const allParticipants = await participantController.getAllParticipants();
    res.status(200).json(allParticipants);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get a specific participant by ID
participantRouter.get("/:participantId", async (req, res) => {
  try {
    const participantId = req.params.participantId;
    const participant = await participantController.getParticipantById(participantId);
    res.status(200).json(participant);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to update a specific participant by ID
participantRouter.put('/:participantId', async (req, res) => {
  try {
    const participantId = req.params.participantId;
    const updatedParticipant = req.body;
    await participantController.updateParticipant(participantId, updatedParticipant);
    res.status(200).json({ response: "Participant updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a specific participant by ID
participantRouter.delete("/:participantId", async (req, res) => {
  try {
    const participantId = req.params.participantId;
    await participantController.deleteParticipantById(participantId);
    res.status(200).json({ response: "Participant deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


module.exports = participantRouter;

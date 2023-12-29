const express = require("express");
const participantRouter = express.Router();
const ParticipantController = require("../controllers/participant");
const participantController = new ParticipantController();

// Route to create a new participant
participantRouter.post("/", async (req, res) => {
  try {
    const newparticipant=await participantController.addparticipant(req, res);
    return res.status(200).json(newparticipant);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all participants
participantRouter.get("/", async (req, res) => {
  try {
    const allParticipants = await participantController.getAllparticipants(req, res);
    return res.status(200).json(allParticipants);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get a specific participant by ID
participantRouter.get("/:participantId", async (req, res) => {
  try {
    const participantId = req.params?.participantId;
    const participant = await participantController.getparticipantById(participantId);
    return res.status(200).json(participant);
  }
   catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to update a specific participant by ID
participantRouter.put('/:participantId', async (req, res) => {
  try {
    const participantId = req.params?.participantId;
    const updatedParticipant = req.body;
    const updatedone=await participantController.updateparticipant(participantId, updatedParticipant);
   return res.status(200).json(updatedone);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a specific participant by ID
participantRouter.delete("/:participantId", async (req, res) => {
  try {
    const participantId = req.params?.participantId;
    await participantController.deleteparticipantById(participantId);
    res.status(200).json({ response: "Participant deleted successfully" });
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


module.exports = participantRouter;
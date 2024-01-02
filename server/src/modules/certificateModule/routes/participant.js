const express = require("express");
const participantRouter = express.Router();
const ParticipantController = require("../controllers/participant");
const participantController = new ParticipantController();
const multer = require('multer');

const storage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
}); // Store files in memory

const upload = multer({ storage: storage });

// Route to create a new Batch participant
participantRouter.post("/",upload.single('csvfile'), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    await participantController.addBatchparticipant(fileBuffer,req.query?.eventId);
    return res.status(200).json({message: 'Data added succesfully'});
  } 
  catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to create a new participant
participantRouter.post("/addparticipant/:eventId", async (req, res) => {
  try {
    const newparticipant=await participantController.addparticipant(req.body);
    return res.status(200).json(newparticipant);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all participants
participantRouter.get("/getparticipant/:eventId", async (req, res) => {
  try {
    const allParticipants = await participantController.getAllparticipants(req.params?.eventId);
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
participantRouter.put('/addparticipant/:participantId', async (req, res) => {
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
participantRouter.delete("/deleteparticipant/:participantId", async (req, res) => {
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
const express = require("express");
const router = express.Router();
const { sendEmailsToParticipants } = require("../controllers/emails");
const { sendEmail } = require("../controllers/participantemail");

router.post("/send-emails", async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required in the request body",
    });
  }

  try {
    await sendEmailsToParticipants(eventId, req.baseURL);
    res
      .status(200)
      .json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/send-email", async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res
        .status(400)
        .json({ error: "Participant ID is required in the request params." });
    }

    // Call the sendEmailToParticipant function with the participantId
    await sendEmail(participantId, req.baseURL);

    // Respond with a success message
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

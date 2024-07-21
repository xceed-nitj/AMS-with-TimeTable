const express = require("express");
const router = express.Router();
const { sendEmailsToParticipants } = require("../controllers/emails");
const { sendEmail } = require("../controllers/participantemail");
// const ecmadminRoute = require("../../usermanagement/ecmadminroute");
const { checkRole } = require("../../checkRole.middleware");

router.post("/send-emails/:eventId", checkRole(['CM']), async (req, res) => {
  const eventId = req.params.eventId;
  const referer = req.get('Referer');
    // Extract the host from the Referer URL
    const baseURL = new URL(referer).origin;
  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required in the request body",
    });
  }

  try {
    await sendEmailsToParticipants(eventId, baseURL);
    res
      .status(200)
      .json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/send-email/:participantId",checkRole(['CM']), async (req, res) => {
  try {
    const participantId = req.params.participantId;
    const referer = req.get('Referer');
    // Extract the host from the Referer URL
    const baseURL = new URL(referer).origin;
    console.log(baseURL);
    if (!participantId) {
      return res
        .status(400)
        .json({ error: "Participant ID is required in the request params." });
    }

    // Call the sendEmailToParticipant function with the participantId
    await sendEmail(participantId, baseURL);

    // Respond with a success message
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

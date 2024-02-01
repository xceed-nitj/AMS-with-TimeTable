const express = require("express");
const router = express.Router();
const { sendEmailsToParticipants } = require("../controllers/emails");
const { sendEmail } = require("../controllers/participantemail");
const { verifyOTP } = require("../controllers/sendotp");
const {
  sendOTP,
} = require("../../usermanagement/controllers/forgotpasswordroute");

router.post("/send-emails", async (req, res) => {
  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required in the request body",
    });
  }

  const event = await addEvent.findOne({ name: eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  const user = await User.findOne({ email: event.user });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found for the given event",
    });
  }

  try {
    // Send OTP to user's email
    const otpResponse = await sendOTP(user.email);

    if (!otpResponse.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    // Redirect user to a new page for OTP verification
    // Assuming you have logic to handle this redirection in your frontend

    // Upon successful OTP verification, call sendEmailsToParticipants
    res.redirect(`/otp-verification?eventId=${eventId}&email=${user.email}`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/send-email", async (req, res) => {
  try {
    const { participantId } = req.query;

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

router.post("/otp-verification", async (req, res) => {
  const { eventId, email, otp } = req.body;

  if (!eventId || !email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Event ID, email, and OTP are required",
    });
  }

  try {
    // Verify OTP
    const otpVerificationResult = await verifyOTP(email, otp);

    if (!otpVerificationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP verification successful, proceed to send emails to participants
    await sendEmailsToParticipants(eventId, req.baseURL);

    res.status(200).json({
      success: true,
      message: "Emails sent successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;

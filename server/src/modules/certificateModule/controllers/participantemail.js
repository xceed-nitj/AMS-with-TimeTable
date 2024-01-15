const Participant = require("../../../models/certificateModule/participant");
const mailSender = require("../../mailsender");
const ejs = require("ejs");

const sendEmail = async (participantId) => {
  try {
    // Fetch the participant from the database based on the provided participantId
    const participant = await Participant.findById(participantId);

    if (!participant) {
      console.log(`Participant with _id ${participantId} not found.`);
      return;
    }

    const path = require("path");
    const emailTemplatePath = path.join(__dirname, "email.ejs");
    const emailTemplate = await ejs.renderFile(emailTemplatePath, {
      eventName: "Your Event Name",
    });

    const url = `cm/c/${participant.eventId}/${participant._id}`;

    const templateData = {
      participant: participant,
      eventName: "Your Event Name",
    };

    let emailBody = await ejs.renderFile(emailTemplatePath, templateData);
    const emailTitle = "Your Email Subject";

    emailBody += `\nEvent URL: ${url}`;

    await mailSender(participant.mailId, emailTitle, emailBody);

    console.log(`Email sent to ${participant.name} (${participant.mailId})`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmail };

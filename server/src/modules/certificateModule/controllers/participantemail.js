const Participant = require("../../../models/certificateModule/participant");
const addEvent = require("../../../models/certificateModule/addevent");
const mailSender = require("../../mailsender");
const ejs = require("ejs");
const { baseURL } = require("../../commons");

const sendEmail = async (participantId) => {
  try {
    // Fetch the participant from the database based on the provided participantId
    const participant = await Participant.findById(participantId);
    const event = await addEvent.findById(participant.eventId);

    if (!participant) {
      console.log(`Participant with _id ${participantId} not found.`);
      return;
    }

    const path = require("path");
    const emailTemplatePath = path.join(__dirname, "email.ejs");

    const url = `${baseURL}/cm/c/${participant.eventId}/${participant._id}`;

    const templateData = {
      participant: participant.name,
      eventName: event.name,
      certificateURL: url,
    };

    let emailBody = await ejs.renderFile(emailTemplatePath, templateData);
    const emailTitle = `${event.name}: Your certificate is here!`;

    await mailSender(participant.mailId, emailTitle, emailBody);

    console.log(`Email sent to ${participant.name} (${participant.mailId})`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmail };

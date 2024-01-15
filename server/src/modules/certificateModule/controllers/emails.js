const Participant = require("../../../models/certificateModule/participant");
const addEvent = require("../../../models/certificateModule/addevent");
const mailSender = require("../../mailsender");
const ejs = require("ejs");


const sendEmailsToParticipants = async (eventId) => {
  try {
    // Fetch all participants from the database
    const allParticipants = await Participant.find();
    if (!allParticipants) {
      raise("No participants found");
    }

    // Fetch the event from the database based on the provided eventId and get event.name, if it exists
    const event = await addEvent.findById(eventId);
    if (!event) {
      raise("Event not found");
    }

    // Assuming you have an emails.ejs template in your views folder
    const path = require("path");
    const emailTemplatePath = path.join(__dirname, "email.ejs");

    console.log("hi3");
    console.log(allParticipants);
    // Loop through all participants and send emails for matching eventId
    for (const participant of allParticipants) {
      if (participant.eventId.toString() === eventId.toString() && !participant.isCertificateSent) {
        const url = `cm/c/${eventId}/${participant._id}`;
        console.log("hi4");

        const templateData = {
          participantName: participant.name,
          eventName: event.name,
          certificateURL: url,
        };


        // Render the template with data
        let emailBody = await ejs.renderFile(emailTemplatePath, ...templateData);
        const emailTitle = `${eventName}: Your certificate is here!`;
        console.log(participant.mailId);
        console.log(emailTitle);

        await mailSender(participant.mailId, emailTitle, emailBody);
      }
    }

    console.log("Emails sent successfully!");
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

module.exports = { sendEmailsToParticipants };

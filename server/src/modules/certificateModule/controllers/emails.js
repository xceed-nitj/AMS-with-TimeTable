const Participant = require("../../../models/certificateModule/participant");
const mailSender = require("../../mailsender");
const ejs = require("ejs");

const sendEmailsToParticipants = async (eventId) => {
  try {
    // Fetch all participants from the database
    const allParticipants = await Participant.find();

    // Assuming you have an emails.ejs template in your views folder
    const path = require("path");
    const emailTemplatePath = path.join(__dirname, "email.ejs");
    const emailTemplate = await ejs.renderFile(`${emailTemplatePath}`, {
      eventName: "Your Event Name",
    });
    console.log("hi3");
    console.log(allParticipants);
    // Loop through all participants and send emails for matching eventId
    for (const participant of allParticipants) {
      if (participant.eventId.toString() === eventId.toString()) {
        const url = `cm/c/${eventId}/${participant._id}`;
        console.log("hi4");

        const templateData = {
          participant: participant,
          eventName: "Your Event Name",
        };

        // Assuming you have an email.ejs template in the same directory as emails.js
        const emailTemplatePath = path.join(__dirname, "email.ejs");

        // Render the template with data
        let emailBody = await ejs.renderFile(emailTemplatePath, templateData);
        const emailTitle = "Your Email Subject";
        console.log(participant.email);
        console.log(emailTitle);

        // Manually add the URL to the email body
        emailBody += `\nEvent URL: ${url}`;

        await mailSender(participant.email, emailTitle, emailBody);
      }
    }

    console.log("Emails sent successfully!");
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

module.exports = { sendEmailsToParticipants };

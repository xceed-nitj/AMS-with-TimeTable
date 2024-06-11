const Paper = require("../../../models/reviewModule/paper.js");
const User = require("../../../models/reviewModule/user.js"); // Importing the User model
const { sendMail } = require("../../mailerModule/mailer.js"); // Importing the sendMail function

const uploadPaper = (req, res) => {
  const fileName = req.fileName;
  const title = req.title;
  const abstract = req.abstract;
  const eventId=req.params.id;

  if (!fileName) {
    return res.status(400).send("File name is missing in the request.");
  }

  const newPaper = new Paper({
    paperId: fileName,
    title: title,
    abstract: abstract,
    uploadLink: fileName,
    eventId:eventId,
  });

  newPaper
    .save()
    .then(async (savedPaper) => {
      // Fetch email addresses of authors from User model based on their IDs
      const authorIds = savedPaper.authors[0];
      const authors = await User.find({ _id: { $in: authorIds } }, 'email');
      const authorEmails = authors.map(author => author.email);

      // Send email notification to author(s)
      const to = "virgarg772003@gmail.com"; //Author is not linked with paper as of now so add your gmail to get email for testing purpose
      const subject = "New Paper Uploaded";
      const message = `A new paper titled "${title}" has been uploaded.`;
      const attachments=[
        {
          //filename:"title.pdf",
          //path:""
        }
       ];
       
      
      await sendMail(to, subject, message);
      

      console.log("Paper saved successfully:", savedPaper);
      res.status(200).send("Paper uploaded and saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving paper:", error);
      res.status(500).send(error);
    });
};

module.exports = uploadPaper;

const Paper = require("../../../models/reviewModule/paper.js");
const XUser = require("../../../models/usermanagement/user.js"); // Importing the User model
const { sendMail } = require("../../mailerModule/mailer.js"); // Importing the sendMail function
const Event  = require("../../../models/reviewModule/event.js");

const uploadPaper = async(req, res) => {
  const fileName = req.fileName;
  const title = req.title;
  const abstract = req.abstract;
  const eventId=req.params.id;
  const authors=req.authors;
  const terms=req.terms;
  const track=req.track;
  const codefile = req.codeName;

  const event = await Event.findById(eventId);
  const deadline = event.paperSubmissionDate;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  if (today > deadlineDate) {
      return res.status(503).send("Paper submission after deadline is forbidden");
  }
  
  if (!fileName) {
    return res.status(400).send("File name is missing in the request.");
  }

  const papers = await Paper.find({"eventId" : eventId});
  const count = papers.length+1;
  const newPaper = new Paper({
    paperId: count,
    eventId:eventId,
    title: title,
    abstract: abstract,
    uploadLink: fileName,
    codeLink: codefile,
    eventId:eventId,
    authors: authors,
    tracks:[track],
    terms: terms,
  });

  newPaper
    .save()
    .then(async (savedPaper) => {
      // Fetch email addresses of authors from User model based on their IDs
      for (let i=0;i<savedPaper.authors.length;i++){
        const authorIds = savedPaper.authors[i];
        console.log(authorIds);
        const authors = await XUser.find({_id:authorIds});
        const authorEmails = authors.map(author => author.email);
        console.log(authors);

        // Send email notification to author(s)
        const to = authorEmails[0]; //Author is not linked with paper as of now so add your gmail to get email for testing purpose
        const subject = "New Paper Uploaded";
        const message = `A new paper titled "${title}" has been uploaded.`;
        const attachments=[
          {
            //filename:"title.pdf",
            //path:""
          }
        ];
        
        
        await sendMail(to, subject, message);
      }

      console.log("Paper saved successfully:", savedPaper);
      res.status(200).send("Paper uploaded and saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving paper:", error);
      res.status(500).send(error);
    });
};

module.exports = uploadPaper;

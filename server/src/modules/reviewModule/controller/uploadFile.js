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
  const check = req.ps;
  console.log(check[0].institute);
  const event = await Event.findById(eventId);
  const deadline = event.paperSubmissionDate;
  const today = new Date();
  const deadlineDate = new Date(deadline);
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
    .then(async () => {
      // Fetch email addresses of authors from User model based on their IDs
      for (let i=0;i<check.length;i++){
        const authorIds = check[i].order;
        console.log(authorIds);
        const authors = await XUser.find({_id:authorIds});
        const authorEmails = authors.map(author => author.email);
        console.log(authors);

        // Send email notification to author(s)
        const to = authorEmails[0]; //Author is not linked with paper as of now so add your gmail to get email for testing purpose
        if (check[i].institute === false){
        const subject = "New Paper Uploaded";
        const message = `A new paper titled "${title}" has been uploaded.<br>${event.templates.paperAssignment}`;
        const attachments=[
          {
            //filename:"title.pdf",
            //path:""
          }
        ];
        await sendMail(to, subject, message);
        }else{
          const subject = "You have been added as an author and a New Paper is Uploaded";
          const message = `A new paper titled "${title}" has been uploaded.<br> ${event.templates.paperAssignment}<br>Your password is 1234, please login to check.`;
          const attachments=[
            {
              //filename:"title.pdf",
              //path:""
            }
          ];
          await sendMail(to, subject, message);
        }  
      }

      console.log("Paper saved successfully:", newPaper);
      res.status(200).json({message: "Paper uploaded and saved successfully!", paperlink:`reviewmodule/uploads/${req.fileName}`,codelink:`reviewmodule/uploads/${req.codeName}`});
    })
    .catch((error) => {
      console.error("Error saving paper:", error);
      res.status(500).send(error);
    });
};

module.exports = uploadPaper;

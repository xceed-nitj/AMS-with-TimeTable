const Paper = require("../../../models/reviewModule/paper.js");
const XUser = require("../../../models/usermanagement/user.js"); // Importing the User model
const { sendMail } = require("../../mailerModule/mailer.js"); // Importing the sendMail function
const Event  = require("../../../models/reviewModule/event.js");

function replacePlaceholders(template, values) {
  return template.replace(/{{(.*?)}}/g, (match, p1) => {
      // Trim the placeholder name
      const key = p1.trim();
      // Return the value if it exists, otherwise return the placeholder as is
      return values.hasOwnProperty(key) ? values[key] : match;
  });
}
const uploadPaper = async(req, res) => {
  const submissionstatus = "Submitted";
  const id = req.id;
  const fileName = req.fileName;
  const title = req.title;
  const abstract = req.abstract;
  const eventId=req.params.id;
  const authors=req.authors;
  const terms=req.terms;
  const track=req.track;
  const codefile = req.codeName;
  const check = req.ps;
  const event = await Event.findById(eventId);
  const deadline = event.paperSubmissionDate;
  const mail_status=[];
  const today = new Date();
  const deadlineDate = new Date(deadline);
  if (today > deadlineDate) {
      return res.status(503).send("Paper submission after deadline is forbidden");
  }
  
  if (!fileName) {
    return res.status(400).send("File name is missing in the request.");
  }
  if (id !== '') {
    try {
      const paper = await Paper.findById(id);
      if (paper) {
        paper.uploadLink = fileName;
        paper.codeLink = codefile;
        paper.version = paper.version + 1;
        await paper.save();
        const sub=`Paper titled ${title} has been modified`;
        const body=`Paper titled ${title} has been modified<br/>
        <a href='http://nitjtt.netlify.app/prm/${eventId}/${id}/summary'>Click here to view</a>`;
        for (let i=0;i<paper.reviewers.length;i++){
          console.log(paper.reviewers[i].username);
          sendMail(paper.reviewers[i].username,sub,body);
        }
        console.log("Paper updated successfully:", paper);
        return res.status(200).json({ message: "Paper updated successfully", paperlink: `reviewmodule/uploads/${fileName}`, codelink: `reviewmodule/uploads/${codefile}` });
      } else {
        return res.status(404).send("Paper not found");
      }
    } catch (error) {
      console.error("Error updating paper:", error);
      return res.status(500).send("Error updating paper");
    }
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
    pseudo_authors:check,
    tracks:[track],
    terms: terms,
    submissionStatus:submissionstatus,
  });

  newPaper
    .save()
    .then(async () => {
      // Fetch email addresses of authors from User model based on their IDs
      for (let i=0;i<check.length;i++){
        const authorIds = check[i].existing_id;
        console.log(authorIds);
        const authors = await XUser.find({_id:authorIds});
        const authorEmails = authors.map(author => author.email);
        console.log(authors);

        // Send email notification to author(s)
        const to = authorEmails[0]; //Author is not linked with paper as of now so add your gmail to get email for testing purpose
        if (check[i].isNew === false){
        const subject = "New Paper Uploaded";
        try{
          const auth_names = authors.map(item => item.name);
          const recieved_message = `${event.templates.paperAssignment}`;
            const values = {
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
             // This value is not used in the template
            };
          
          const result = replacePlaceholders(recieved_message, values);
            const attachments=[
              {
                //filename:"title.pdf",
                //path:""
              }
            ];
            await sendMail(to, subject, result);
          mail_status.push(true);
        }catch(err){
          mail_status.push(`false${err}`);
        }
        }else{
          try{
            const auth_names = authors.map(item => item.name);
            const subject = "You have been added as an author and a New Paper is Uploaded";
            const recieved_message = `${event.templates.paperAssignment}`;
            const values = {
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
             // This value is not used in the template
            };
          
          const result = replacePlaceholders(recieved_message, values);
            const attachments=[
              {
                //filename:"title.pdf",
                //path:""
              }
            ];
            await sendMail(to, subject, result);
            mail_status.push(true);
          }catch(err){
            mail_status.push(`false${err}`);
          }
        }  
      }

      console.log("Paper saved successfully:", newPaper);
      res.status(200).json({message: `Paper uploaded and saved successfully!Mail sent:${mail_status}`, paperlink:`reviewmodule/uploads/${req.fileName}`,codelink:`reviewmodule/uploads/${req.codeName}`});
    })
    .catch((error) => {
      console.error("Error saving paper:", error);
      res.status(500).send(error);
    });
};

module.exports = uploadPaper;

const Paper = require("../../../models/reviewModule/paper.js");
const Reviews = require("../../../models/reviewModule/review.js");
const express = require("express");
const bodyParser = require("body-parser");
const User = require("../../../models/usermanagement/user.js");
const XUser = require("../../../models/usermanagement/user.js");
const Event = require("../../../models/reviewModule/event.js");
const { sendMail } = require("../../mailerModule/mailer.js"); // Importing the sendMail function
const getEnvironmentURL =require('../../../getEnvironmentURL.js')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ExcelJS = require('exceljs');
const jwtSecret =
  "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
function replacePlaceholders(template, values) {
  return template.replace(/{{(.*?)}}/g, (match, p1) => {
      // Trim the placeholder name
      const key = p1.trim();
      // Return the value if it exists, otherwise return the placeholder as is
      return values.hasOwnProperty(key) ? values[key] : match;
  });
}
const findAllPapers = async (req, res) => {
  const papers = await Paper.find({});
  if (!papers) {
    return res.status(401).json("No Papers Found");
  } else {
    return res.status(200).send(papers);
  }
};

const findEventPaper = async (req, res) => {
  let eventId = req.params.id;
  const paper = await Paper.find({ eventId: eventId }).exec();

  if (!paper) {
    return res.status(401).json("Invalid paperId");
  } else {
    return res.status(200).send(paper);
  }
};

const PaperCountByTrack = async (req, res) => {
  let eventId = req.params.id;
  const paper = await Paper.find({ eventId: eventId }).exec();

  if (!paper) {
    return res.status(401).json("Invalid paperId");
  } else {
    let trackCounts ={};
    const countPapersByTrack = (paper) => {
      trackCounts ={};
      paper.forEach(paper => {
        paper.tracks.forEach(track => {
          if (trackCounts[track]) {
            trackCounts[track].count += 1;
          } else {
            trackCounts[track] = { name: track, count: 1 };
          }
        });
      });
    };
    countPapersByTrack(paper);
    // console.log(trackCounts);
    return res.status(200).send(trackCounts);
  }
};

const PaperStatusCount = async (req, res) => {
  let eventId = req.params.id;
  const paper = await Paper.find({ eventId: eventId }).exec();

  if (!paper) {
    return res.status(401).json("Invalid paperId");
  } else {
    let accepted = 0;
    let rejected = 0;
    let underreview = 0;
    paper.forEach(pap=> {
      if(pap.status === "Accepted"){
        accepted++;
      }else if(pap.status === "Rejected"){
        rejected++;
      }else{
        underreview++;
      }
    });
    let status = {accepted,rejected,underreview};
    // console.log(status)
    return res.status(200).send(status);
  }
};

const ReviewsStatusCount = async (req, res) => {
  let eventId = req.params.id;
  try {
    const papers = await Paper.find({ eventId: eventId }).exec();
    if (!papers || papers.length === 0) {
      return res.status(404).json({ message: "No papers found for the given eventId" });
    }

    const paperIds = papers.map(paper => paper._id);
    const reviews = await Reviews.find({ paperId: { $in: paperIds } }).exec();
    let completed = 0;
    let partial = 0;
    let notReceived = 0;

    const reviewCountMap = reviews.reduce((arr, review) => {
      arr[review.paperId] = (arr[review.paperId] || 0) + 1;
      return arr;
    }, {});

    papers.forEach(paper => {
      const reviewCount = reviewCountMap[paper._id] || 0;
      if (paper.reviewers.length !== 0) {
        if(reviewCount===0){
          notReceived++;
        } else if (reviewCount === paper.reviewers.length) {
          completed++;
        } else {
          partial++;
        }
      }
    });

    let status = { completed, partial, notReceived };
    console.log(status)
    return res.status(200).json(status);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const findPaper = async (req, res) => {
  let id = req.params.id;
  const paper = await Paper.find({ paperId: id }).exec();

  if (!paper) {
    return res.status(401).json("Invalid paperId");
  } else {
    return res.status(200).send(paper);
  }
};

const findPaperByReviewer = async (req, res) => {
  let id = req.params.id;
  const paper = await Paper.find({ 'reviewers.userId': id }).exec();

  if (!paper) {
    return res.status(401).json("Invalid ReviewerId");
  } else {
    return res.status(200).send(paper);
  }
};

const findPaperByAuthor = async (req, res) => {
  let id = req.params.id;
  try{
    const papers = await Paper.find({ 'authors': id })
                        .select('_id eventId title status')
                        .exec();
    if (!papers.length) {
      return res.status(401).json("No papers found for this author");
    }
    const eventIds = papers.map(paper => paper.eventId);

    const events = await Event.find({ _id: { $in: eventIds } })
                              .select('_id name')
                              .exec();
    const eventMap = events.reduce((map, event) => {
      map[event._id.toString()] = event.name;
      return map;
    }, {});
    // Merge the event names into the papers array
    const papersWithEventNames = papers.map(paper => ({
      _id: paper._id,
      eventId: paper.eventId,
      eventName: eventMap[paper.eventId.toString()],
      title: paper.title,
      status: paper.status
                              }));
    return res.status(200).send(papersWithEventNames);
  }catch(err){
    console.log("invalid");
    return res.status(401).send(err);
  }
};

const findPaperById=async(req,res)=>{
  try{
      const id=req.params.id;
      const paper= await Paper.findById(id).exec();
      if(!paper){
        return res.status(404).json("Invalid paper id or no papers found");
      } else{
        return res.status(200).send(paper);
      }
  }
  catch(error){
     console.log("Error is ",error);
     res.status(500).json({ error: error.message });
  }
};

const updatePaper = async (req, res) => {
  let paperId = req.params.id;
  console.log(paperId);
  const updateFields = req.body.updateFields;

  const paper = await Paper.findById(paperId);
  console.log(paperId);
  const user = req.body.user; // Assuming that the user is logged in and the user object is available in the request object

  // const customParam = { paperId: paperId };
  // const updateObject = { $set: { [updatedField]: updatedFieldValue } };

  // try {
  //   const updatedPaper = await Paper.findOneAndUpdate(customParam, updateFields, { new: true });
  //   res.status(200).send("user updated", updatedPaper);
  // } catch (error) {
  //   res.status(500).send("Internal server error", error);
  // }

  try {
    if (user.role === "editor") {
      for (const field of Object.keys(updateFields)) {
        console.log(field);
        if (
          paper.schema.paths[field] &&
          paper.schema.paths[field].options.editorAccess
        ) {
          console.log("inside if");
          paper[field] = updateFields[field];
        } else {
          return res
            .status(403)
            .json({ message: "Editors are not allowed to modify this field" });
        }
      }
      const newPaper = await paper.save();
      return res.status(200).json({ message: "Paper updated", newPaper });
    } else if (user.role === "reviewer") {
      for (const field of Object.keys(updateFields)) {
        if (
          paper.schema.paths[field] &&
          paper.schema.paths[field].options.reviewerAccess
        ) {
          paper[field] = updateFields[field];
        } else {
          return res.status(403).json({
            message: "Reviewers are not allowed to modify this field",
          });
        }
      }
    } else if (user.role === "author") {
      for (const field of Object.keys(updateFields)) {
        if (
          paper.schema.paths[field] &&
          paper.schema.paths[field].options.authorAccess
        ) {
          paper[field] = updateFields[field];
        } else {
          return res.status(403).json({
            message: "Authors are not allowed to modify this field",
          });
        }
      }
    }
    const updatePaper = await paper.save();
    res.status(200).json({ message: "Paper updated", updatePaper });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const addReviewer = async (req, res) => {
  try {
    const paperId = req.params.id;
    const { email,baseUrl } = req.body;

    if (!email) {
      console.error('Email is required');
      return res.status(400).send('Email is required');
    }
    let reviewers = await XUser.findOne({ email });

    const paper = await Paper.findById(paperId);

    if (!paper) {
      console.error('Given paper not found:', paperId);
      return res.status(404).send('Paper not found');
    }

    // Check if reviewer is already assigned
    const isAlreadyReviewer = paper.reviewers.some(r => r.userId.equals(reviewers._id));
    if (isAlreadyReviewer) {
      return res.status(400).send('Reviewer already added to this paper');
    }
    // Add reviewer to the paper
    const eventId=paper.eventId;
    const event = await Event.findById(eventId);
    const eventName=event.name;
    const currentDate = new Date();
    const daysToAdd = event.reviewTime;
    const days = parseInt(daysToAdd, 10);
    currentDate.setDate(currentDate.getDate() + days);
    paper.reviewers.push({ userId: reviewers._id,username:email, dueDate:currentDate});
    await paper.save();
    console.log("added successfully");
    const reviewerInvitationTemplate=event.templates.paperAssignment;
    const signature=event.templates.signature;
    const viewLink = `${baseUrl}/prm/${eventId}/editor/papers`; // Use the base URL
    const values = {
      paperId: paperId,
      eventId:eventName,
      title: paper.title,
      abstract: paper.abstract,
      uploadLink: paper.uploadLink,
      codeLink: paper.codeLink,
      eventId: paper.eventId,
      authors: paper.authors,
      tracks:paper.tracks,
      terms: paper.terms,
     // This value is not used in the template
    };
    
    const result = replacePlaceholders(reviewerInvitationTemplate, values);
    console.log(result);
    // Send the reviewer invitation email
    await sendMail(
      email,`You have been added as a reviewer to the paper with title: ${paper.title}`,
      ` ${result} <br>
      Please click <a href="${viewLink}">here</a> to view the papers <br>
      ${signature}
      `

    );
    console.log("email sent");
    res.status(200).send('Reviewer added to the paper successfully');
  } catch (error) {
    console.error('Error adding reviewer:', error);
    res.status(500).send('Internal server error');
  }
};
const removeReviewer = async (req,res)=>{
  try {
    // Find the paper by paperId
    const paperid = req.params.id;
    const {userId} = req.body;
    console.log(paperid);
    const paper = await Paper.findById(paperid);
    console.log(paper);

    if (!paper) {
        throw new Error('Paper not found');
    }

    // Filter out the reviewer with the given userId
    paper.reviewers = paper.reviewers.filter(reviewer => String(reviewer.userId) !== userId);
    // Save the updated paper document
    await paper.save();
    console.log(`Reviewer with userId ${userId} removed successfully from paper ${paperid}`);
    res.status(200).send("REMOVED SUCCESSFULLY"); // or you can return some meaningful response
} catch (error) {
    console.error('Error removing reviewer:', error.message);
    res.status(500).send(error) // or handle the error appropriately
}
};

const addAuthor = async (req, res) => {
  const { name, email, designation, eventId } = req.body;
  const password = "1234"; // A random password could be used
  console.log("email: ", email, "\neventid: ",eventId);

  try {
    // Check if the user already exists
    const existingUser = await XUser.findOne({ email: email });

    if (existingUser) {
      console.log("User already exists");
      return res.status(200).json({
        message: "User already exists",
        updatedId: existingUser._id,
        mail: false
      });
    }

    console.log("User not found, creating new user");

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with the hashed password
    const event = await Event.findById(eventId);
    const newUser = new XUser({
      name: name,
      email: email,
      profession: designation,
      role: ["PRM", "Author"],
      password: hashedPassword,
    });

    // Save the new user
    await newUser.save();

    // Send email notification
    const reviewerInvitationTemplate=event.templates.paperSubmission;
    const signature=event.templates.signature;
    /*await sendMail(
      email,
      'You have been added as an author',
      ` ${reviewerInvitationTemplate} <br>'
      Here's your temporary password: ${password}. Please login to change it.<br>
      XCEED`
    );*/

    console.log("User created and email sent");

    return res.status(201).json({
      message: "User successfully created",
      updatedId: newUser._id,
      mail: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred while creating the user",
      error: error.message,
    });
  }
};
const updateDecision = async (req, res) => {
  const { eventId, paperId } = req.params;
  const { decision, commentsEditor, commentsAuthor } = req.body;
   console.log("decision is ",decision);
   console.log("editor comment is ", commentsEditor);
   console.log("comments Author  is ",commentsAuthor);
  try {
    // Find the paper
    const paper = await Paper.findOne({ eventId, _id: paperId })
    console.log("Paper detail is this ", paper);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    paper.finalDecision = decision;

    // Save editor comments to reviewers (assuming there's a mechanism to update reviewer comments as well)
    // paper.reviewers.forEach(reviewer => {
    //   reviewer.comment_editor = editorComments;
    // });

    await paper.save();
 
    // Find all authors associated with the paper
       // Find all authors associated with the paper
       const authorIds = paper.authors.map(author => author._id);
       console.log("Author id is:", authorIds);
   
       // Use $in to find authors whose role array contains 'Author'
       const authors = await User.find({ _id: { $in: authorIds }, role: { $in: ['Author'] } });
       console.log("Author is:", authors);
   
    if (!authors || authors.length === 0) {
      return res.status(404).json({ error: 'Authors not found' });
    }

    // Extract emails of authors
    const authorEmails = authors.map(author => author.email[0]);
   console.log("Email is :",authorEmails)
    // Send email to all authors
    const emailContent = `
      <p>Dear Author,</p>
      <p>We are writing to inform you of the final decision regarding your paper submission.</p>
      <p><strong>Decision:</strong> ${decision}</p>
      <p><strong>Editor Comments:</strong> ${commentsEditor}</p>
      <p><strong>Reviewer Comments:</strong> ${commentsAuthor}</p>
      <p>Thank you for your submission.</p>
      <p>Best regards,</p>
      <p>The Xceed Team</p>
    `;

    await sendMail(authorEmails, 'Final Decision on Your Paper Submission', emailContent);

    res.status(200).json({ message: 'Decision updated and email sent to the authors' });
  } catch (error) {
    console.error('Error updating decision:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const addAuthorbyId = async (req, res) => {
  const { paperId, authorId } = req.params;

  try {
    // Find the paper
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Find the author
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Check if the author is already in the authors list
    if (paper.authors.includes(author._id)) {
      return res.status(400).json({ error: 'Author already added to this paper' });
    }

    // Add the author to the paper's authors list
    paper.authors.push(author._id);
    await paper.save();

    res.status(200).json({ message: 'Author added to the paper successfully' });
  } catch (error) {
    console.error('Error adding author to paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const dupliCheck = async (req, res) => {
  try {
    const papers = await Paper.find({eventId:req.params.id}).select('title authors').exec();
    res.send(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const download = async (req, res) => {
  try {
    const data = await Paper.find().lean();
    const {columnsToSend} = req.body;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    worksheet.columns = columnsToSend.map(col => ({
      header: col.header,
      key: col.key,
      width: 30,
    }));

    data.forEach((item) => {
      const row = {};
      columnsToSend.forEach(col => {
        if (col.key === 'reviewerEmails') {
          row[col.key] = item.reviewers.map(reviewer => reviewer.username).join(', ');
        }
        else{
          row[col.key] = item[col.key];
        }
      });
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename="paper.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating spreadsheet', error);
    res.status(500).send('Server Error');
  }
}

module.exports = { findAllPapers, updateDecision,addAuthorbyId,addReviewer, findEventPaper, findPaper , updatePaper, removeReviewer,findPaperById, findPaperByReviewer,findPaperByAuthor , addAuthor, PaperCountByTrack, PaperStatusCount,ReviewsStatusCount,dupliCheck,download};

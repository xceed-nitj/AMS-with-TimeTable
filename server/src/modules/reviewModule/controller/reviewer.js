const Paper = require("../../../models/reviewModule/paper.js");
const User = require("../../../models/reviewModule/user.js");
const mailSender = require("../../mailsender.js");
const express = require("express");
const bodyParser = require("body-parser");
const { sendMail } = require("../../mailerModule/mailer.js"); 
const path = require("path");

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const getAllReviewers = async (req, res) => {
  try {
    const user = await User.find({ role: "Reviewer" }).exec();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

const addReviewer = async (req, res) => {
  let { paperId, userId } = req.query;
  console.log(paperId, userId);

  try {
    const paper = await Paper.findById(paperId);

    if (!paper) {
      res.status(401).send("Paper not found");
      return;
    }

    const user = await User.findById(userId);

    // if (!SignedInUser) {
    //   res.status(401).send("User not found");
    //   return;
    // }

    // if (SignedInUser.role !== "Editor") {
    //   res.status(401).send("Only editor is allowed to add reviewer");
    // }

    paper.reviewers.push({
      userId: userId,
    });

    const newPaper = await paper.save();
 // Send email notification to the reviewer
 const reviewerEmail = user.email[0]; // Assuming the reviewer's email is stored in the User document for now it is not added but will add soon. Now it is sending mail to editor email only from the default email in env file
 const subject = "You have been assigned as a reviewer";
 const message = `You have been assigned as a reviewer for the paper titled "${paper.title}". Please login to the system to review the paper.`;
 
 await sendMail(reviewerEmail, subject, message);


    res
      .status(200)
      .json({ message: "Reviewer added successfully", paper: newPaper });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const updateReviewer = async (req, res) => {
  const paperId = req.params.paperid;
  const userId = req.params.reviewerid;
  const updateData = req.body;
  console.log(paperId, userId, updateData);
  try {
    const pseudo_paper = await Paper.findOne({_id:paperId,"reviewers.userId": userId});
    const paper = await Paper.findOneAndUpdate(
      { _id:paperId, "reviewers.userId": userId },
      {
        $set: {
          "reviewers.$.rating": updateData.rating || pseudo_paper.reviewers.rating,
          "reviewers.$.comment_author": updateData.comment_author || pseudo_paper.reviewers.comment_author,
          "reviewers.$.comment_editor": updateData.comment_editor || pseudo_paper.reviewers.comment_editor,
          "reviewers.$.status": updateData.status || pseudo_paper.reviewers.status,
          "reviewers.$.dueDate": updateData.newDate || pseudo_paper.reviewers.dueDate,
          "reviewers.$.reviewerStatus": updateData.reviewerStatus || pseudo_paper.reviewers.reviewerStatus,
        },
      },
      { new: true }
    );

    // const paper = await Paper.findById(paperId);

    // const updateFields = {};

    // // Iterate over each key-value pair in updateData
    // for (const fields of Object.entries(updateData)) {
    //   // Check if the field being updated is allowed based on access level
    //   if (
    //     paper.schema.paths[`reviewers.$.${fields}`] &&
    //     paper.schema.paths[`reviewers.$.${fields}`].options.editorAccess
    //   ) {
    //     // If allowed, include the update in the updateFields object
    //     updateFields[`reviewers.$.${fields}`] = updateData[fields];
    //   }
    // }

    // console.log(updateFields);

    // const updatedpaper = await Paper.findOneAndUpdate(
    //   { paperId: paperId, "reviewers.userId": userId },
    //   { $set: updateFields },
    //   { new: true }
    // );
    if (!paper) {
      return res.status(404).json({ message: "Paper not found" });
    }

    const reviewerIndex = paper.reviewers.findIndex(
      (reviewer) => reviewer.userId.toString() === userId.toString()
    );

    if (reviewerIndex === -1) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    await paper.save();

    return res
      .status(200)
      .json({ message: "Reviewer information updated successfully", paper });
  } catch (error) {
    console.error("Error updating reviewer information:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const deleteReviewer = async (req, res) => {
  const { paperId, userId } = req.query;
  try {
    const paper = await Paper.findOne({ paperId });

    if (!paper) {
      throw new Error("Paper not found");
    }

    const reviewerIndex = paper.reviewers.findIndex(
      (reviewer) => reviewer.userId.toString() === userId.toString()
    );

    if (reviewerIndex === -1) {
      throw new Error("Reviewer not found");
    }

    paper.reviewers.splice(reviewerIndex, 1);

    await paper.save();

    console.log("Reviewer deleted successfully");
    res.status(200).send("Reviewer Successfylly deleted");
  } catch (error) {
    console.error("Error deleting reviewer:", error.message);
    res.status(500).send("Internal server error", error.message);
  }
};

module.exports = { getAllReviewers, addReviewer, updateReviewer, deleteReviewer };

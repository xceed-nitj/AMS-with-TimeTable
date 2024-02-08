const Paper = require("../../../models/reviewModule/paper.js");
const User = require("../../../models/reviewModule/user.js");
const mailSender = require("../../mailsender.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const addReviewer = async (req, res) => {
  let { paperId, userId } = req.query;

  const paper = await Paper.findOne({ paperId });

  if (!paper) {
    res.status(401).send("Paper not found");
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(401).send("User not found");
    return;
  }

  paper.reviewers.push({
    userId: userId,
    status: "Under Review",
  });

  await paper.save();

  // const populatedPaper = await Paper
  // .findById(paper._id)
  // .populate('authors') 
  // .populate('editors')
  // .populate('reviewers.userId')
  // .exec();

  // console.log(populatedPaper);

  try {
    const email = user.email[0];
    const title = "Test Email";
    const body = `<p>This is a test email for paper ${paper.paperId}.</p>`;

    const info = await mailSender(email, title, body);

    console.log("Email sent successfully:", info);
    res.status(200).send("Reviewer added successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Error sending email:", error);
  }
};


const updateReviewer = async (req, res) => {
  const { paperId, userId } = req.query;
  const { updateData } = req.body;
  try {
    const paper = await Paper.findOneAndUpdate(
      { paperId, "reviewers.userId": userId },
      {
        $set: {
          "reviewers.$.rating": updateData.rating || undefined,
          "reviewers.$.comment_author": updateData.comment_author || undefined,
          "reviewers.$.comment_editor": updateData.comment_editor || undefined,
          "reviewers.$.status": updateData.status || undefined,
        },
      },
      { new: true }
    );

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

module.exports = { addReviewer, updateReviewer, deleteReviewer};

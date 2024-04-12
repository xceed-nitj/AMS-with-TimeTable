const Paper = require("../../../models/reviewModule/paper.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const findAllPapers = async (req, res) => {
  const papers = await Paper.find({});
  if (!papers) {
    return res.status(401).json("No Papers Found");
  } else {
    return res.status(200).send(papers);
  }
};

const findPaper = async (req, res) => {
  let paperId = req.params.id;
  const paper = await Paper.find({ paperId: paperId }).exec();

  if (!paper) {
    return res.status(401).json("Invalid paperId");
  } else {
    return res.status(200).send(paper);
  }
};

const updatePaper = async (req, res) => {
  let paperId = req.params.id;
  const updateFields = req.body.updateFields;

  const paper = await Paper.findById(paperId);
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
        if (paper.schema.paths[field] && paper.schema.paths[field].options.editorAccess) {
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
        if (paper.schema.paths[field] && paper.schema.paths[field].options.reviewerAccess) {
          paper[field] = updateFields[field];
        } else {
          return res
            .status(403)
            .json({
              message: "Reviewers are not allowed to modify this field",
            });
        }
      }
    }
    else if (user.role === "author") {
      for (const field of Object.keys(updateFields)) {
        if (paper.schema.paths[field] && paper.schema.paths[field].options.authorAccess) {
          paper[field] = updateFields[field];
        } else {
          return res
            .status(403)
            .json({
              message: "Authors are not allowed to modify this field",
            });
        }
      }
    }
    const updatePaper = await paper.save();
    res.status(200).json({ message: "Paper updated", updatePaper });
  } catch (error) {
    res.status(500).json({error:error.message
    });
  }
}; 

module.exports = { findAllPapers, findPaper, updatePaper };

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
  const updateFields = req.body;

  const customParam = { paperId: paperId };
  // const updateObject = { $set: { [updatedField]: updatedFieldValue } };

try {
  const updatedPaper = await Paper.findOneAndUpdate(customParam, updateFields, { new: true });
  res.status(200).send("user updated", updatedPaper);
} catch (error) {
  res.status(500).send("Internal server error", error);
}

};

module.exports = { findAllPapers, findPaper, updatePaper };

const NIRF = require("../../../models/nirfRanking/nirf.js");
// const User = require("../../../models/reviewModule/user.js");
// const mailSender = require("../../mailsender.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const getAllRanking = async (req, res) => {
  try {
    const user = await NIRF.find();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}


// Add institutes
const addRanking = async (req, res) => {
    const { year, category } = req.params;
    const institutes = req.body;

    if (!year || !category) {
        return res.status(400).json({ message: 'Year and Type parameters are required' });
    }

    try {
        const modifiedInstitutes = institutes.map(institute => ({
            ...institute,
            Year: year,
            Category: category,
        }));

        const result = await NIRF.insertMany(modifiedInstitutes);
        res.status(201).json({ message: 'Institutes added successfully!', result });
    } catch (error) {
        res.status(500).json({ message: 'Error adding institutes', error });
    }
};




module.exports = { getAllRanking, addRanking };

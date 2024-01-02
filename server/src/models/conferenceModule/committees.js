const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const committeeSchema = new mongoose.Schema({
  ConfId: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
    required: true,
  },
  Subtype: {
    type: String,
    required: true,
  },
  Name: {
    type: String,
    required: true,
  },
  Designation: {
    type: String,
    required: true,
  },
  Institute: {
    type: String,
    required: true,
  },
  ProfileLink: {
    type: String,
    required: true,
  },
  ImgLink: {
    type: String,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  feature: {
    type: Boolean,
    required: true,
  },
});

// Create the Mongoose model
const Committee = mongoose.model("Committee", committeeSchema);

module.exports = Committee;

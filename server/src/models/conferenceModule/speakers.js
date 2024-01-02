const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const speakersSchema = new mongoose.Schema({
  ConfId: {
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
  TalkType: {
    type: String,
    required: true,
  },
  TalkTitle: {
    type: String,
    required: true,
  },
  Abstract: {
    type: String,
    required: true,
  },
  Bio: {
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
const Speakers = mongoose.model("Speakers", speakersSchema);

module.exports = Speakers;

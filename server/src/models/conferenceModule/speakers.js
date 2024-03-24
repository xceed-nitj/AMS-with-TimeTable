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
  },
  Institute: {
    type: String,
  },
  ProfileLink: {
    type: String,
  },
  ImgLink: {
    type: String,
  },
  TalkType: {
    type: String,
  },
  TalkTitle: {
    type: String,
  },
  Abstract: {
    type: String,
  },
  Bio: {
    type: String,
  },
  sequence: {
    type: Number,
  },
  feature: {
    type: Boolean,
  },
});

// Create the Mongoose model
const Speakers = mongoose.model("cf-speaker", speakersSchema);

module.exports = Speakers;

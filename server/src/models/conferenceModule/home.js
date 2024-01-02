const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const homeSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  confName: {
    type: String,
    required: true,
  },
  confStartDate: {
    type: Date,
    required: true,
  },
  confEndDate: {
    type: Date,
    required: true,
  },
  aboutConf: {
    type: String,
    required: true,
  },
  aboutIns: String,
  youtubeLink: String,
  instaLink: String,
  facebookLink: String,
  twitterLink: String,
  logo: String,
  shortName: String,
});

// Create the Mongoose model
const Home = mongoose.model("Home", homeSchema);

module.exports = Home;

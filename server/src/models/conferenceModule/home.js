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
  },
  confEndDate: {
    type: Date,
  },
  
  about: [
    {
      title: {
        type: String,
      },
      description: {
        type: String,
      },
    },
  ],
  youtubeLink: String,
  instaLink: String,
  facebookLink: String,
  twitterLink: String,
  logo: String,
  shortName: String,
  abstractLink : String,
  paperLink : String,
  regLink : String,
  flyerLink : String,
  brochureLink : String,
  posterLink: String,
});

// Create the Mongoose model
const Home = mongoose.model("cf-home", homeSchema);

module.exports = Home;

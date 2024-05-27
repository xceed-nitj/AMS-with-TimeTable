const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const commonTemplate = new mongoose.Schema({
  
  confId: {
    type: String,
    required: true,
  },
  pageTitle: {
    type: String,
  },
  description: {
    type: String,
  },
  feature: {
    type: Boolean,
  },
  sequence: {
    type: Number,
  }}, { timestamps: true }

);

// Create the Mongoose model
const CommonTemplate = mongoose.model("cf-commontemplate", commonTemplate);

module.exports = CommonTemplate;

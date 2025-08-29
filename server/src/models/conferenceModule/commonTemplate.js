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
  // Add this field to your commontemplate schema
descriptionDelta: {
  type: mongoose.Schema.Types.Mixed, // Can store Delta object
  default: null
},
  sequence: {
    type: Number,
  }}, { timestamps: true }

);

// Create the Mongoose model
const CommonTemplate = mongoose.model("cf-commontemplate", commonTemplate);

module.exports = CommonTemplate;

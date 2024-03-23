const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const awardsSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  title1: {
    type: String,
    required: true,
  },
  title2: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
  new: {
    type: Boolean,
    required: true,
  },
  hidden: {
    type: Boolean,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
});

// Create the Mongoose model
const Awards = mongoose.model("cf-awards", awardsSchema);

module.exports = Awards;

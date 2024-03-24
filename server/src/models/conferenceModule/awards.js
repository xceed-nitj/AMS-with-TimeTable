const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const awardsSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  title1: {
    type: String,
  },
  title2: {
    type: String,
  },
  description: {
    type: String,
  },
  sequence: {
    type: Number,
  },
  featured: {
    type: Boolean,
  },
  new: {
    type: Boolean,
  },
  hidden: {
    type: Boolean,
  },
  link: {
    type: String,
  },
});

// Create the Mongoose model
const Awards = mongoose.model("cf-awards", awardsSchema);

module.exports = Awards;

const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const accomodationSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  title: {
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
  }
});

// Create the Mongoose model
const Accomodation = mongoose.model("cf-accomodation", accomodationSchema);

module.exports = Accomodation;

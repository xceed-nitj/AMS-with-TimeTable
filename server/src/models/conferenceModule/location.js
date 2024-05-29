const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const locationSchema = new mongoose.Schema({
  
  confId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
  },
  latitude: {
    type: String,
  },
  longitude: {
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
const Location = mongoose.model("cf-location", locationSchema);

module.exports = Location;

const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const locationSchema = new mongoose.Schema({
  
  confId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  latitude: {
    type: String,
    required: true,
  },
  longitude: {
    type: String,
    required: true,
  },
  feature: {
    type: Boolean,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  }}, { timestamps: true }

);

// Create the Mongoose model
const Location = mongoose.model("Location", locationSchema);

module.exports = Location;

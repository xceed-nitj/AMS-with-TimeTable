const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const locationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
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
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

// Create the Mongoose model
const Location = mongoose.model("Location", locationSchema);

module.exports = Location;

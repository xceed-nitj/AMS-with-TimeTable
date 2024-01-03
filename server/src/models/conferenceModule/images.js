const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const imageSchema = new mongoose.Schema({
  
  confId: {
    type: String,
    required: true,
  },
  name: String,
  imgLink: {
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
const Image = mongoose.model("Image", imageSchema);

module.exports = Image;

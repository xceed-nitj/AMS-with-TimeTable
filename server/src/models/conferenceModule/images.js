const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const imageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
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
const Image = mongoose.model("Image", imageSchema);

module.exports = Image;

const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const allotmentSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  faculty: {
    type: Array,
    required: true,
  },
  group: {
    type: String,
  },
  room: {
    type: String,
  },
  code: {
    type: String,
    required: true,
  }, 
});

// Create the Mongoose model
const Allotment = mongoose.model("Allotment", allotmentSchema);

module.exports = Allotment;

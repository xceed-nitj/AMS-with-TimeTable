const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const allotmentSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  room: {
    type: String,
  },
  day: {
    type: String,
  },
  availableSlots: {
    type: Array,
  }, 
});

// Create the Mongoose model
const Allotment = mongoose.model("Allotment", allotmentSchema);

module.exports = Allotment;

const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const eventDateSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  extended: {
    type: Boolean,
    required: true,
  },
  newDate: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
});

// Create the Mongoose model
const EventDate = mongoose.model("EventDate", eventDateSchema);

module.exports = EventDate;

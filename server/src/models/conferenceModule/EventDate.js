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
  },
  extended: {
    type: Boolean,
  },
  newDate: {
    type: Date,
  },
  completed: {
    type: Boolean,
  },
  featured: {
    type: Boolean,
  },
});

// Create the Mongoose model
const EventDate = mongoose.model("cf-eventDate", eventDateSchema);

module.exports = EventDate;

const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');
const participantTypes = ["internal", "external"];
const organiserTypes = ["department", "club", "center"];

// Define your Mongoose schema based on the interface
const addEventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  ExpiryDate: {
    type: Date,
    required: true,
  }, 
  ParticipantType:{
    type: String,
    required: true,
    enum: participantTypes,
  },
  OrganiserType: {
    type: String,
    required: true,
    enum: organiserTypes,
  },
  EventType:{
    type: String,
    required: true,
  }
});

addEventSchema.add(commonFields);

// Apply the pre-save middleware
addEventSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const addEvent = mongoose.model("addEvent", addEventSchema);

module.exports = addEvent;

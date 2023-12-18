const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');
const participantTypes = ["participation", "prize"];

// Define your Mongoose schema based on the interface
const ParticipantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  college: {
    type: String,
    required: true,
  }, 
  types:{
    type: String,
    required: true,
    enum: participantTypes,
  },
  position: {
    type: number,
    required: true,
    enum: organiserTypes,
  },
  title1:{
    type: String,
    required: true,
  },
  title1:{
    type: String,
    required: true,
  },
});

ParticipantSchema.add(commonFields);

// Apply the pre-save middleware
ParticipantSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Participant = mongoose.model("Participant", ParticipantSchema);

module.exports = Participant;

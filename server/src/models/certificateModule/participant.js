const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require("../commonFields");
const participantTypes = ["participation", "prize"];
const organiserTypes = ["department", "club", "center"];

// Define your Mongoose schema based on the interface
const ParticipantSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  department: {
    type: String,
  },
  college: {
    type: String,
  },
  mailId: {
    type: String,
  },
  certiType: {
    type: String,
  },
  teamName: {
    type: String,
  },
  position: {
    type: String,
  },
  title1: {
    type: String,
  },
  title2: {
    type: String,
  },
  eventId: {
    type: String,
  },
});

ParticipantSchema.add(commonFields);

// Apply the pre-save middleware
ParticipantSchema.pre("save", updateTimestamps);

// Create the Mongoose model
const Participant = mongoose.model("Participant", ParticipantSchema);

module.exports = Participant;

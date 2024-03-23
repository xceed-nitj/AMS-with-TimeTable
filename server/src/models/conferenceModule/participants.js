const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const participantSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorDesignation: {
    type: String,
    required: true,
  },
  authorInstitute: {
    type: String,
    required: true,
  },
  paperTitle: {
    type: String,
    required: true,
  },
  paperId: {
    type: String,
    required: true,
  },
});

// Create the Mongoose model
const ParticipantCF = mongoose.model("cf-participant", participantSchema);

module.exports = ParticipantCF;

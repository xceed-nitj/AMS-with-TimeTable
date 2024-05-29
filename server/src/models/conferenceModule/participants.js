const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const participantSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
  },
  authorDesignation: {
    type: String,
  },
  authorInstitute: {
    type: String,
  },
  paperTitle: {
    type: String,
  },
  paperId: {
    type: String,
  },
});

// Create the Mongoose model
const ParticipantCF = mongoose.model("cf-participant", participantSchema);

module.exports = ParticipantCF;

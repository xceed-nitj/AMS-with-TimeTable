const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Main timetable change log schema
const timetableChangeLogSchema = new Schema({
  time: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  changes: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

const TimetableChangeLog = mongoose.model(
  "TimetableChangeLog",
  timetableChangeLogSchema
);

module.exports = TimetableChangeLog;

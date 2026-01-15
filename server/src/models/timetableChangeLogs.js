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
  dept: {
    type: String,
    required: false,
  },
  session: {
    type: String,
    required: false,
  },
});

// TTL index: automatically remove documents 365 days after `time`
timetableChangeLogSchema.index({ time: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const TimetableChangeLog = mongoose.model(
  "TimetableChangeLog",
  timetableChangeLogSchema
);

module.exports = TimetableChangeLog;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');


// Define your Mongoose schema based on the interface
const locksemSchema = new mongoose.Schema({
  day: {
    type: String,
  },
  slot: {
    type: String,
  },
  slotData: [
    {
      subject: {
        type: String,
      },
      faculty: {
        type: String,
      },
      room: {
        type: String,
      },
    },
  ],
  sem: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  timetable: {
    type: Schema.Types.ObjectId,
    ref: "timetable"
  }
});

locksemSchema.add(commonFields);

// Apply the pre-save middleware
locksemSchema.pre('save', updateTimestamps);


// Create the Mongoose model
const LockSem = mongoose.model("LockSem", locksemSchema);

module.exports = LockSem;


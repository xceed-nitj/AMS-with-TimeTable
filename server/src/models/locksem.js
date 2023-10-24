const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

// Create the Mongoose model
const LockSem = mongoose.model("LockSem", locksemSchema);

module.exports = LockSem;


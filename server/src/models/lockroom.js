const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const locksemSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
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
  lastUpdated:{
    type: Date,
  },
  lastLockedBy:{
    type: String,
  },
    
});

// Create the Mongoose model
const LockSem = mongoose.model("LockSem", locksemSchema);

module.exports = LockSem;


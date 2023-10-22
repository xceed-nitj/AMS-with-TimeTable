const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const lockfacultySchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  facultyName: {
    type: String,
    required: true,
  },
  facultyID: {
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
  faculty: {
    type: Schema.Types.ObjectId,
    ref: "faculty"
  },
  lastUpdated:{
    type: Date,
  },
  lastLockedBy:{
    type: String,
  },
});

// Create the Mongoose model
const LockFaculty = mongoose.model("LockFaculty", lockfacultySchema);

module.exports = LockFaculty;


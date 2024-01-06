const mongoose = require("mongoose");
const { commonFields } = require("./commonFields");

const attendanceSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  slot: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  attendance: [{
    type: Boolean,
    required: true,
  }],
  sem: {
    type: Number,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  remark: [{
    type: String,
  }],
  studentID: [{
    type: Number,
    required: true,
  }],
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
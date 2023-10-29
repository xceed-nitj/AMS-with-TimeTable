const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


// Define the Mongoose schema for the student
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollNo: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  sem: {
    type: Number,
    required: true,
  },
  mailID: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
});


studentSchema.add(commonFields);

// Apply the pre-save middleware
studentSchema.pre('save', updateTimestamps);

// Create the Mongoose model for the student
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;

const mongoose = require("mongoose");

// Define the Mongoose schema for the student
const studentSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  RollNo: {
    type: String,
    required: true,
  },
  Dept: {
    type: String,
    required: true,
  },
  Sem: {
    type: Number,
    required: true,
  },
  MailID: {
    type: String,
    required: true,
  },
  Gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
});

// Create the Mongoose model for the student
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;

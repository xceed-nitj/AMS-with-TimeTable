const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const studentSchema = new mongoose.Schema({
  // ConfId: {
  //   type: String,
  //   required: true,
  // },
  Slot: {
    type: String,
    required: true,
  },
  SubCode: {
    type: String,
    required: true,
  },
  SubName: {
    type: String,
    required: true,
  },
  Sem: {
    type: Number,
    required: true,
  },
  Branch: {
    type: String,
    required: true,
  },
  Day: {
    type: String,
    required: true,
  },
  Type: {
    type: String, // Example: "class", "lab", "tut"
    required: true,
  },
  Designation: {
    type: String, // Example: "faculty", "guest"
    required: true,
  },
});

// Create the Mongoose model
const Student= mongoose.model("Student", studentSchema);

module.exports = Student;

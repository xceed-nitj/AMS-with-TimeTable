const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const addFacultySchema = new mongoose.Schema({
  sem: {
    type: String,
    required: true,
  },
  faculty: {
    type: Array,
    required: true,
  },
  code: {
    type: String,
    required: true,
  }, 
});

// Create the Mongoose model
const addFaculty = mongoose.model("addFaculty", addFacultySchema);

module.exports = addFaculty;

const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');

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

addFacultySchema.add(commonFields);

// Apply the pre-save middleware
addFacultySchema.pre('save', updateTimestamps);

// Create the Mongoose model
const addFaculty = mongoose.model("addFaculty", addFacultySchema);

module.exports = addFaculty;

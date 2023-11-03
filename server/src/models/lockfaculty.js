const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');

// Define your Mongoose schema based on the interface
const lockFacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  abbreviation: {
    type: String,
    required: true,
  },
  subCode: {
    type: String,
    required: true,
  },
  subName: {
    type: String,
    required: true,
  }, 
  room: {
    type: String,
    required: true,
  },
  sem: {
    type: String,
    required: true,
  },
  session:{
    type: String,
    required: true,
  }
});

lockFacultySchema.add(commonFields);

// Apply the pre-save middleware
lockFacultySchema.pre('save', updateTimestamps);

// Create the Mongoose model
const lockFaculty = mongoose.model("lockFaculty", lockFacultySchema);

module.exports = lockFaculty;

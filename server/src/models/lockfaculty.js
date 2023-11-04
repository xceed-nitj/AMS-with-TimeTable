const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');

// Define your Mongoose schema based on the interface
const lockFacultySchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  timeTableData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  summaryData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: Schema.Types.Mixed,
    required: true,
  }, 
  TTData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  updatedTime: {
    type: Schema.Types.Mixed,
    required: true,
  },
  headTitle:{
    type: Schema.Types.Mixed,
    required: true,
  }
});

lockFacultySchema.add(commonFields);

// Apply the pre-save middleware
lockFacultySchema.pre('save', updateTimestamps);

// Create the Mongoose model
const lockFaculty = mongoose.model("lockFaculty", lockFacultySchema);

module.exports = lockFaculty;

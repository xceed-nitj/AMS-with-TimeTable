const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');

// Define your Mongoose schema based on the interface
const instituteLoadSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  sem: {
    type: Array,
    required: true,
  },
  type: {
    type: Array,
  },
load:{
  type: Array,
    },
  strength:{
    type: Array,
    // required: true,
  }
});

instituteLoadSchema.add(commonFields);

// Apply the pre-save middleware
instituteLoadSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const instituteLoad = mongoose.model("instituteLoad", instituteLoadSchema);

module.exports = instituteLoad;

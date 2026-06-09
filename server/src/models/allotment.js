// server/src/models/allotment.js

const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');
const Schema = mongoose.Schema;

// Define your Mongoose schema based on the interface
const allotmentSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  centralisedAllotments: {
    type: Schema.Types.Mixed,
    // default: null
  },
  openElectiveAllotments: {
    type: Schema.Types.Mixed,
    // default: null 
  },
  message:{
    type: String,
  },

  // ADDED FOR GLOBAL SESSION TIMELINE TRACKING
  startingDate: { 
    type: String, 
    default: ''  // Stores "YYYY-MM-DD"
  },
  endingDate: { 
    type: String, 
    default: ''  // Stores "YYYY-MM-DD"
  },
  nonWorkingDays: [
    {
      date:   { type: String, required: true },               // Stores "YYYY-MM-DD"
      remark: { type: String, default: 'Holiday Override' }   // e.g., "Sunday", "Diwali Break"
    }
  ],

});

allotmentSchema.add(commonFields);

// Apply the pre-save middleware
allotmentSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Allotment = mongoose.model("Allotment", allotmentSchema);

module.exports = Allotment;
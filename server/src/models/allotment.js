const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


// Define your Mongoose schema based on the interface
const allotmentSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
  },
  room: {
    type: String,
  },
  slot: {
    type: [String],
  },

});

allotmentSchema.add(commonFields);

// Apply the pre-save middleware
allotmentSchema.pre('save', updateTimestamps);


// Create the Mongoose model
const Allotment = mongoose.model("Allotment", allotmentSchema);

module.exports = Allotment;

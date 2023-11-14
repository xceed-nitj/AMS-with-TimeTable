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

});

allotmentSchema.add(commonFields);

// Apply the pre-save middleware
allotmentSchema.pre('save', updateTimestamps);


// Create the Mongoose model
const Allotment = mongoose.model("Allotment", allotmentSchema);

module.exports = Allotment;

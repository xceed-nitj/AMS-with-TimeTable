const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');


// Define your Mongoose schema based on the interface
const tableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  code: {
    type: String,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

tableSchema.add(commonFields);

// Apply the pre-save middleware
tableSchema.pre('save', updateTimestamps);

const TimeTable = mongoose.model("TimeTable", tableSchema);

module.exports = TimeTable;


const mongoose = require("mongoose");
const generateUniqueLink = require("../modules/timetableModule/helper/createlink");

// Define your Mongoose schema based on the interface
const tableSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Dept: {
    type: String,
    required: true,
  },
  Session: {
    type: String,
    required: true,
  },
  Code: {
    type: String,
  },
});

tableSchema.pre('save', async function (next) {
  const generatedCode = await generateUniqueLink();
  this.Code = generatedCode;
  next();
});

// Create the Mongoose model
const TimeTable = mongoose.model("Table", tableSchema);

module.exports = TimeTable;


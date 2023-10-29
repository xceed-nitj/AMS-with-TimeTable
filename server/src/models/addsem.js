const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');

const addSemSchema = new mongoose.Schema({
  sem: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  }, 
});

addSemSchema.add(commonFields);

// Apply the pre-save middleware
addSemSchema.pre('save', updateTimestamps);


const addSem = mongoose.model("addSem", addSemSchema);

module.exports = addSem;

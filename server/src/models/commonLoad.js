const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');

const commonLoadSchema = new mongoose.Schema({
  Faculty: {
    type: String,
    required: true,
  },
  SubCode: {
    type: String,
    required: true,
  },
  SubFullName: {
    type: String,
    required: true,
  },
  SubName: {
    type: String,
    required: true,
  },
  Hrs: {
    type: Number,
    required: true,
  },
  Code: {
    type: String,
    required: true,
  },
});

commonLoadSchema.add(commonFields);

commonLoadSchema.pre('save', updateTimestamps);

const CommonLoad = mongoose.model("commonLoad", commonLoadSchema);

module.exports = CommonLoad;

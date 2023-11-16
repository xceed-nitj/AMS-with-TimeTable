const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');

const commonLoadSchema = new mongoose.Schema({
  faculty: {
    type: String,
    required: true,
  },
  subCode: {
    type: String,
    required: true,
  },
  subFullName: {
    type: String,
    required: true,
  },
  subName: {
    type: String,
    required: true,
  },
  subType: {
    type: String,
    required: true,
  },
  sem: {
    type: String,
    required: true,
  },
  hrs: {
    type: Number,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

commonLoadSchema.add(commonFields);

commonLoadSchema.pre('save', updateTimestamps);

const CommonLoad = mongoose.model("commonLoad", commonLoadSchema);

module.exports = CommonLoad;

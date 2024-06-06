const mongoose = require('mongoose');
const user = require('../usermanagement/user');
const User = require('../usermanagement/user');
const Schema = mongoose.Schema;

const quizSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  marginTime: {
    type: Date,
    required: true,
  },
  resultTime: {
    type: Date,
    required: true,
  },
  quizName: {
    type: String,
    required: true,
  },
  sectionName: {
    type: [String],
    default: [],
  },
  negativeMarking: {
    type: Number,
    default: 0,
  },
  preventMobile: {
    type: Boolean,
    default: false,
  },
  allowTabchange: {
    type: Boolean,
    default: false,
  },
  creator: {
    type: String,
    required: true,
  },
  collaborators: {
    type: [String],
    default: [],
  },
  instructions: {
    type: [String],
    default: [],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
});


const Quiz = mongoose.model('qz-quizzes', quizSchema);

module.exports = Quiz;

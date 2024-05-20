const mongoose = require("mongoose");

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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  });

const Quiz = mongoose.model("qz-quiz", quizSchema);
module.exports = Quiz
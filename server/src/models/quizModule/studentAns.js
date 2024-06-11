const mongoose = require('mongoose');
const { Schema } = mongoose;

const Quiz = require('./quiz');
const QuizQuestion = require('./quizQuestion');

const studentAnswerSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answer: {
    type: [String],
    default: [],
  },
  timeElapsed: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    default: null,
  },
  sectionId: {
    type: Number,
    default: null,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizQuestion',
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
}, {
  timestamps: true,
});

const StudentAnswer = mongoose.model('qz-studentans', studentAnswerSchema);

module.exports = StudentAnswer;

const mongoose = require('mongoose');
const { Schema } = mongoose;

const Quiz = require('./quiz');
const QuizQuestion = require('./quizQuestion');

const studentAnswerSchema = new Schema({
  studentId: {
    type: Number,
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
    type: Schema.Types.ObjectId,
    ref: 'QuizQuestion',
    required: true,
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
}, {
  timestamps: true,
});

const StudentAnswer = mongoose.model('StudentAnswer', studentAnswerSchema);

module.exports = StudentAnswer;

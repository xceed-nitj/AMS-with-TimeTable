const mongoose = require('mongoose');
const { Schema } = mongoose;
const Quiz = require('./quiz');

const quizQuestionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: [String],
    default: [],
  },
  explanation: {
    type: String,
    required: false,
  },
  questionTime: {
    type: Number,
    default: 60,
  },
  mark: {
    type: Number,
    default: 1,
  },
  sectionId: {
    type: Number,
    default: 1,
  },
  questionType: {
    type: String,
    enum: ['multiple', 'numerical', 'single'],
    default: 'single',
  },
  questionLevel: {
    type: String,
    enum: ['hard', 'medium', 'easy'],
    default: 'easy',
  },
  negativeMark: {
    type: Number,
    default: 0,
  },
  options: {
    type: [String],
    default: [],
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
});

const QuizQuestion = mongoose.model('qz-quizquestion', quizQuestionSchema);
module.exports = QuizQuestion;

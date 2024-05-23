const mongoose = require('mongoose');

const quizOrderArraySchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  questionOrder: {
    type: [String], 
    default: [],
  },
  index: {
    type: Number, 
  },
  status: {
    type: Boolean,
    default: true,
  },
  firstQues: {
    type: Boolean,
    default: false,
  },
});

const QuizOrderArray = mongoose.model('qz-quizorderarray', quizOrderArraySchema);

module.exports = QuizOrderArray;

const mongoose = require('mongoose');
const User = require('../usermanagement/user.js');
const Event = require('./event.js');
const Forms=require('./forms.js')

const formAnswerSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forms', required: true },
  formAnswers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forms', required: true },
      answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Mixed type to store any kind of answer
      order: { type: Number }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const FormAnswer = mongoose.model('PRS-FormAnswers', formAnswerSchema);

module.exports = FormAnswer;

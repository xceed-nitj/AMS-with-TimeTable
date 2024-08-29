const mongoose = require('mongoose');
const User = require('../usermanagement/user.js');
const Event = require('./event.js');
const Form = require('./forms.js'); // Correct the import

const formAnswerSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  formAnswers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form.questions._id', required: true },
      answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Mixed type to handle text, array of options, or single option
      order: { type: Number }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const FormAnswer = mongoose.model('FormAnswer', formAnswerSchema);

module.exports = FormAnswer;

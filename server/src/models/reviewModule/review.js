const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  paperId: { type: String, required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewAnswers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewQuestion' },
      answer: { type: mongoose.Schema.Types.Mixed } // Mixed type to store any kind of answer
    }
  ],
  commentsAuthor: { type: String },
  commentsEditor: { type: String },
  decision: {
    type: String,
    enum: ['Accepted', 'Rejected', 'Need Revision'],
    default: 'Need Revision'
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

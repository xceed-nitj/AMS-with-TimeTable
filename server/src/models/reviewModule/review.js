const mongoose = require("mongoose");
const User =require("./user");
const Event =require("./event");
const Paper=require("./paper");

const reviewSchema = new mongoose.Schema({
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewans: [{ type: String }],
    commentsAuthor: { type: String },
    commentsEditor: { type: String },
    decision: { type: String, enum: ['Accepted', 'Rejected', 'Needs Revision'], required: true  },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

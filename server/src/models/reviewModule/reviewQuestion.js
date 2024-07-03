const mongoose = require("mongoose");
const User =require("../usermanagement/user");
const Event =require("./event");
const Paper=require("./paper");


const reviewQuestionSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    show: { type: Boolean, default: false },
    type: [{ type: String }],
    question: [{ type: String }],
    options: [{ type: String }],
    order: [{type:Number}]
},{timestamps: true});

const ReviewQuestion = mongoose.model("PRS-ReviewQuestion", reviewQuestionSchema);

module.exports = ReviewQuestion;

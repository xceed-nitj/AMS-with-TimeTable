const mongoose = require('mongoose');

const defaultQuestionSchema = new mongoose.Schema({
    show: { type: Boolean, default: false },
    type: [{ type: String }],
    question: [{ type: String }],
    options: [{ type: String }]
});

const DefaultQuestion = mongoose.model("PRS-DefaultQuestion", defaultQuestionSchema);

module.exports = DefaultQuestion;
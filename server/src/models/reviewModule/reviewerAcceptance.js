const mongoose = require('mongoose');

const reviewerAcceptanceSchema = new mongoose.Schema({
    paperId: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
});

const ReviewerAcceptance = mongoose.model('ReviewerAcceptance', reviewerAcceptanceSchema);

module.exports = ReviewerAcceptance;

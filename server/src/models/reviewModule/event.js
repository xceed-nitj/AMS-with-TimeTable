const mongoose = require("mongoose");
const User = require("./user.js");

const reviewerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PRS-User' },
    status: { type: String, enum: ['Invited', 'Accepted', 'Pending', 'Not Accepted'], default: 'Pending' }
});

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    tracks:[{type: String}],
    editor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PRS-User' }],
    reviewer: [reviewerSchema],
    paperSubmissionDate: {
        type: Date,
    },
    reviewTime: {
        type: String,
    },
    instructions: {
        type: String
    }
});

const Event = mongoose.model("PRS-Event", eventSchema);

module.exports = Event;

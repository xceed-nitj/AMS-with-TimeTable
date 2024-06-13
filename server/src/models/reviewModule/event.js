const mongoose = require("mongoose");
const User = require("./user.js");

const reviewerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    status: { type: String, enum: ['Invited', 'Accepted', 'Pending', 'Not Accepted'], default: 'Pending' }
});

const templateSchema = new mongoose.Schema({
    paperSubmission: { type: String, default: "No data"},
    reviewerInvitation: { type: String, dafault: "No data"},
    paperAssignment:{type: String, dafault: "No data"},
    reviewSubmission: {type:String, dafault: "No data"},
    paperRevision: {type: String,dafault: "No data"},
    PaperDecision: {type: String, dafault: "No data"},
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
    editor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    reviewer: [reviewerSchema],
    paperSubmissionDate: {
        type: Date,
    },
    reviewTime: {
        type: String,
    },
    instructions: {
        type: String
    },
    templates:templateSchema,
});

const Event = mongoose.model("PRS-Event", eventSchema);

module.exports = Event;

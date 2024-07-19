const mongoose = require("mongoose");
const User = require("../usermanagement/user");

const reviewerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    status: { type: String, enum: ['Invited', 'Accepted', 'Pending', 'Not Accepted'], default: 'Pending' }
});

const templateSchema = new mongoose.Schema({
    paperSubmission: { type: String, default: "No data"},
    reviewerInvitation: { type: String, default: "No data"},
    paperAssignment:{type: String, default: "No data"},
    reviewSubmission: {type:String, default: "No data"},
    paperRevision: {type: String,default: "No data"},
    signature: {type: String, default: "No data"},
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
        default: "10"
    },
    instructions: {
        type: String
    },
    templates:templateSchema,
    startSubmission: {
        type: Boolean,
        default: false
    },
},{timestamps: true});

const Event = mongoose.model("PRS-Event", eventSchema);

module.exports = Event;

const mongoose = require('mongoose');

const defaultTemplateSchema = new mongoose.Schema({
    paperSubmission: { type: String, default: "Default paper submission template" },
    reviewerInvitation: { type: String, default: "Default reviewer invitation template" },
    paperAssignment: { type: String, default: "Default paper assignment template" },
    reviewSubmission: { type: String, default: "Default review submission template" },
    paperRevision: { type: String, default: "Default paper revision template" },
    signature: { type: String, default: "Default signature template" },
},{timestamps: true});

const DefaultTemplate = mongoose.model('PRS-DefaultTemplate', defaultTemplateSchema);

module.exports = DefaultTemplate;

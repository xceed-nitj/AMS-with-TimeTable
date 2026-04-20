// server/src/models/attendanceModule/studentEmbedding.js
const mongoose = require('mongoose');
const { commonFields, updateTimestamps } = require('../commonFields');

const studentEmbeddingSchema = new mongoose.Schema({
    // batch is kept for backward compatibility but is no longer required
    // new records use sem + subject + dept instead
    batch:           { type: String, default: '' },
    dept:            { type: String, default: '' },
    degree:          { type: String, default: '' },
    sem:             { type: String, default: '' },
    subject:         { type: String, default: '' },
    subjectCode:     { type: String, default: '' },
    embeddingFile:   { type: String, default: null },
    rollNos:         { type: [String], default: [] },
    missedRollNos: [{
        rollNo:  { type: String },
        reason:  { type: String },
    }],
    photoFiles:      { type: [String], default: [] },
    generatedAt:     { type: Date, default: Date.now },
    status:          { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    error:           { type: String, default: null },
    studentsTotal:   { type: Number, default: 0 },
    studentsSuccess: { type: Number, default: 0 },
    studentsFailed:  { type: Number, default: 0 },
});

studentEmbeddingSchema.add(commonFields);
// Index on sem+subject for the new query pattern, keep batch+subject for legacy
studentEmbeddingSchema.index({ sem: 1, subject: 1 });
studentEmbeddingSchema.index({ batch: 1, subject: 1 });
studentEmbeddingSchema.index({ embeddingFile: 1 });
studentEmbeddingSchema.pre('save', updateTimestamps);

module.exports = mongoose.model('StudentEmbedding', studentEmbeddingSchema);
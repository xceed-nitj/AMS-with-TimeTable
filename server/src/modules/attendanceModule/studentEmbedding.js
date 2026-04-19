// server/src/models/attendanceModule/studentEmbedding.js
const mongoose = require('mongoose');
const { commonFields, updateTimestamps } = require('../commonFields');

const studentEmbeddingSchema = new mongoose.Schema({
    batch:           { type: String, required: true },   // e.g. "BTECH_ECE_2023"
    degree:          { type: String, default: '' },      // e.g. "BTECH"
    sem:             { type: String, default: '' },      // e.g. "6"
    subject:         { type: String, default: '' },      // e.g. "Digital Electronics"
    subjectCode:     { type: String, default: '' },      // e.g. "DE401"
    embeddingFile:   { type: String, default: null },    // e.g. "BTECH_ECE_2023_DE401.pkl"
    rollNos:         { type: [String], default: [] },    // all roll nos requested
    missedRollNos: [{ 
        rollNo:  { type: String },
        reason:  { type: String },   // "No ground truth folder" / "No photos found" / "ML error"
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
studentEmbeddingSchema.index({ batch: 1, subject: 1 });
studentEmbeddingSchema.pre('save', updateTimestamps);

module.exports = mongoose.model('StudentEmbedding', studentEmbeddingSchema);
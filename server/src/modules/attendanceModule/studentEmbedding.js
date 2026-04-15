// server/src/models/attendanceModule/studentEmbedding.js
const mongoose = require('mongoose');
const { commonFields, updateTimestamps } = require('../commonFields');

const studentEmbeddingSchema = new mongoose.Schema({
    batch:          { type: String, required: true },   // e.g. "BTECH_CSE_2022"
    rollNo:         { type: String, required: true },
    subject:        { type: String, default: '' },      // e.g. "Mathematics-III"
    embeddingFile:  { type: String, default: null },    // e.g. "BTECH_CSE_2022.pkl"
    photoFiles:     { type: [String], default: [] },    // which GT photos were used
    generatedAt:    { type: Date, default: Date.now },
    status:         { type: String, enum: ['pending','done','failed'], default: 'pending' },
    error:          { type: String, default: null },
    studentsTotal:  { type: Number, default: 0 },
    studentsSuccess:{ type: Number, default: 0 },
    studentsFailed: { type: Number, default: 0 },
});

studentEmbeddingSchema.add(commonFields);
studentEmbeddingSchema.index({ batch: 1, subject: 1 });
studentEmbeddingSchema.pre('save', updateTimestamps);

module.exports = mongoose.model('StudentEmbedding', studentEmbeddingSchema);
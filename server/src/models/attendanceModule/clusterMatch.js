// server/src/models/attendanceModule/clusterMatch.js
// Stores ERP-matching results per cluster (person_XXX folder) per batch.
// Replaces the need for per-folder _info.json files.

const mongoose = require('mongoose');
const { commonFields, updateTimestamps } = require('../commonFields');

const candidateSchema = new mongoose.Schema({
    rollNo:     { type: String, required: true },
    confidence: { type: Number, required: true },
    erpPhoto:   { type: String, default: null },
}, { _id: false });

const clusterMatchSchema = new mongoose.Schema({
    // Batch identifier e.g. "BTECH_CSE_2023"
    batch:          { type: String, required: true },

    // Original cluster folder name e.g. "person_001" — never changes, used as stable key
    folderName:     { type: String, required: true },

    // Current filesystem folder name.
    // After auto-assign this equals rollNo; for unmatched clusters it stays as folderName.
    currentFolder:  { type: String, default: null },

    // ERP-suggested / operator-confirmed roll number
    rollNo:         { type: String, default: null },

    // Workflow status:
    //   unmatched — no face detected in this cluster, folder not renamed
    //   matched   — ERP match found, folder auto-renamed to rollNo, awaiting operator approval
    //   approved  — operator confirmed the match
    //   flagged   — operator flagged as incorrect
    status: {
        type:    String,
        enum:    ['unmatched', 'matched', 'approved', 'flagged'],
        default: 'unmatched',
    },

    // Whether operator has explicitly verified this match
    approved:       { type: Boolean, default: false },

    // Best ERP match (top-1 candidate)
    erpPhoto:       { type: String, default: null },
    confidence:     { type: Number, default: null },

    // Top-K ERP candidates from matching
    candidates:     { type: [candidateSchema], default: [] },

    // All image filenames inside the cluster folder (replaces _info.json)
    imageFiles:     { type: [String], default: [] },

    // Subset of imageFiles actively used for face embedding
    embeddingFiles: { type: [String], default: [] },

    // First ~6 files shown as thumbnail strip in the UI
    previewFiles:   { type: [String], default: [] },

    imageCount:     { type: Number, default: 0 },

    // Error message when no faces were detected
    error:          { type: String, default: null },
});

clusterMatchSchema.add(commonFields);

// One record per batch + original folder — safe to upsert repeatedly
clusterMatchSchema.index({ batch: 1, folderName: 1 }, { unique: true });
// Quick lookup by assigned rollNo
clusterMatchSchema.index({ batch: 1, rollNo: 1 });

clusterMatchSchema.pre('save', updateTimestamps);

module.exports = mongoose.model('ClusterMatch', clusterMatchSchema);

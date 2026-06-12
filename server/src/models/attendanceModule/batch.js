const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    batchYear: {
        type: String,
        required: true,
        trim: true,
    },
    batchString: {
        type: String,
        unique: true,
    }
}, { timestamps: true });

// Compound index for uniqueness
batchSchema.index({ batchYear: 1 }, { unique: true });

batchSchema.pre('save', function(next) {
    if (this.isModified('batchYear')) {
        const safeYear = String(this.batchYear || '').trim().toUpperCase();
        if (!safeYear) {
            return next(new Error('Batch Year is required to generate a batch name.'));
        }
        this.batchString = safeYear;
    }
    next();
});

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;

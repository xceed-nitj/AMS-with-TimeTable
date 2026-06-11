const mongoose = require('mongoose');
const { generateBatchName } = require('../../modules/attendanceModule/utils/batchUtils');

const batchSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true,
        trim: true,
    },
    program: {
        type: String,
        required: true,
        trim: true,
    },
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
batchSchema.index({ department: 1, program: 1, batchYear: 1 }, { unique: true });

batchSchema.pre('save', function(next) {
    if (this.isModified('department') || this.isModified('program') || this.isModified('batchYear')) {
        try {
            this.batchString = generateBatchName(this.program, this.department, this.batchYear);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;

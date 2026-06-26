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
    },
    degrees: [
        {
            degreeName: String,
            branches: [{
                dept: String,
                branchName: String,
            }]
        }
    ],
    // ─── Dept Role Menu Visibility ─────────────────────────────
    deptMenus: {
    dashboard:         { type: Boolean, default: true },
    groundTruth:       { type: Boolean, default: true },
    rollAssignment:    { type: Boolean, default: true },
    erpUpload:         { type: Boolean, default: true },
    attendanceReports: { type: Boolean, default: true },
    classVerification: { type: Boolean, default: true },
    cameraRegistry:    { type: Boolean, default: true },   // ← new
    subjectEmbeddings: { type: Boolean, default: true },
    livePreview:       { type: Boolean, default: true },
    gpuMetrics:        { type: Boolean, default: true },   // ← new
    confidenceMonitor: { type: Boolean, default: true },
    helpManual:        { type: Boolean, default: true },
},
}, { timestamps: true });

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

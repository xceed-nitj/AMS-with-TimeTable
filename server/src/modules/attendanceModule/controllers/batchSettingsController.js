const Batch = require('../../../models/attendanceModule/batch');

class BatchSettingsController {
    async listBatches(req, res) {
        try {
            const batches = await Batch.find({}).sort({ batchYear: -1 });
            res.json({ batches });
        } catch (error) {
            console.error('[BatchSettingsController] listBatches error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createBatch(req, res) {
        try {
            const { batchYear } = req.body;
            if (!batchYear) {
                return res.status(400).json({ error: 'Batch year is required' });
            }

            const existing = await Batch.findOne({ batchYear });
            if (existing) {
                return res.status(409).json({ error: 'Batch already exists for this year' });
            }

            const batch = new Batch({ batchYear });
            await batch.save();
            
            res.status(201).json({ message: 'Batch created successfully', batch });
        } catch (error) {
            console.error('[BatchSettingsController] createBatch error:', error);
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Batch already exists' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateBatch(req, res) {
        try {
            const { batchYear } = req.body;
            const batch = await Batch.findById(req.params.id);
            
            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            if (batchYear) batch.batchYear = batchYear;

            // Check for conflicts
            const conflict = await Batch.findOne({ 
                batchYear: batch.batchYear,
                _id: { $ne: batch._id }
            });

            if (conflict) {
                return res.status(409).json({ error: 'Another batch already exists with these details' });
            }

            await batch.save();
            res.json({ message: 'Batch updated successfully', batch });
        } catch (error) {
            console.error('[BatchSettingsController] updateBatch error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteBatch(req, res) {
        try {
            const batch = await Batch.findById(req.params.id);
            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            await Batch.findByIdAndDelete(req.params.id);
            res.json({ message: 'Batch deleted successfully' });
        } catch (error) {
            console.error('[BatchSettingsController] deleteBatch error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getDeptMenus(req, res) {
        try {
            // Return a merged/default menu config (use first batch or global defaults)
            const batch = await Batch.findOne({}).sort({ batchYear: -1 });
            const defaults = {
    dashboard: true,
    groundTruth: true,
    rollAssignment: true,
    erpUpload: true,
    attendanceReports: true,
    classVerification: true,
    cameraRegistry: true,   // ← new
    subjectEmbeddings: true,
    livePreview: true,
    gpuMetrics: true,       // ← new
    confidenceMonitor: true,
    instituteIdentification: false,  // off by default — enable per-dept from Dept Menu Config
    erpOverrides: false,             // off by default — enable per-dept from Dept Menu Config
    erpSync: false,                  // off by default — enable per-dept from Dept Menu Config
    helpManual: true,
};
            res.json({ deptMenus: batch?.deptMenus ?? defaults });
        } catch (error) {
            console.error('[BatchSettingsController] getDeptMenus error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateDeptMenus(req, res) {
    try {
        const { deptMenus } = req.body;
        if (!deptMenus || typeof deptMenus !== 'object') {
            return res.status(400).json({ error: 'deptMenus object is required' });
        }

        // Log what changed — visible in server terminal
        const enabledMenus  = Object.entries(deptMenus).filter(([, v]) => v).map(([k]) => k);
        const disabledMenus = Object.entries(deptMenus).filter(([, v]) => !v).map(([k]) => k);

        console.log('\n========================================');
        console.log('  DEPT MENU CONFIG UPDATED');
        console.log('========================================');
        console.log('  ✅ ENABLED  :', enabledMenus.join(', ')  || 'none');
        console.log('  ❌ DISABLED :', disabledMenus.join(', ') || 'none');
        console.log('========================================\n');

        // Apply to all batches (global config)
        const result = await Batch.updateMany({}, { $set: { deptMenus } });
        console.log(`[DeptMenus] MongoDB updated ${result.modifiedCount} batch document(s)`);

        res.json({ message: 'Dept menus updated successfully', deptMenus });
    } catch (error) {
        console.error('[BatchSettingsController] updateDeptMenus error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

    // ---------------------------------------------------------------------
    // Degree Array Endpoints
    // ---------------------------------------------------------------------
    // Retrieve the degree array for a specific batch
    async getDegrees(req, res) {
        try {
            const batch = await Batch.findById(req.params.id);
            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }
            res.json({ degrees: batch.degrees || [] });
        } catch (error) {
            console.error('[BatchSettingsController] getDegrees error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Replace the degree array for a specific batch
    async updateDegrees(req, res) {
        try {
            const { degrees } = req.body;
            if (!Array.isArray(degrees)) {
                return res.status(400).json({ error: '`degrees` must be an array' });
            }
            // Basic validation of each degree object
            for (const d of degrees) {
                if (typeof d.degreeName !== 'string' || !Array.isArray(d.branches)) {
                    return res.status(400).json({ error: 'Each degree must have a string `degreeName` and an array `branches`' });
                }
                for (const b of d.branches) {
                    if (typeof b.dept !== 'string' || typeof b.branchName !== 'string') {
                        return res.status(400).json({ error: 'Each branch must have `dept` and `branchName` strings' });
                    }
                }
            }
            const batch = await Batch.findById(req.params.id);
            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }
            batch.degrees = degrees;
            await batch.save();
            res.json({ message: 'Degrees updated successfully', degrees: batch.degrees });
        } catch (error) {
            console.error('[BatchSettingsController] updateDegrees error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ---------------------------------------------------------------------
    // Global Degree Array Endpoints (update all batches)
    // ---------------------------------------------------------------------
    // Retrieve the degree array from the most recent batch (global view)
    async getGlobalDegrees(req, res) {
        try {
            const batch = await Batch.findOne().sort({ batchYear: -1 });
            res.json({ degrees: batch?.degrees || [] });
        } catch (error) {
            console.error('[BatchSettingsController] getGlobalDegrees error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Replace the degree array for ALL batches (global config)
    async updateAllDegrees(req, res) {
        try {
            const { degrees } = req.body;
            if (!Array.isArray(degrees)) {
                return res.status(400).json({ error: '`degrees` must be an array' });
            }
            // Validate each degree object
            for (const d of degrees) {
                if (typeof d.degreeName !== 'string' || !Array.isArray(d.branches)) {
                    return res.status(400).json({ error: 'Each degree must have a string `degreeName` and an array `branches`' });
                }
                for (const b of d.branches) {
                    if (typeof b.dept !== 'string' || typeof b.branchName !== 'string') {
                        return res.status(400).json({ error: 'Each branch must have `dept` and `branchName` strings' });
                    }
                }
            }
            // Apply to ALL batches (global config)
            const result = await Batch.updateMany({}, { $set: { degrees } });
            console.log(`[GlobalDegrees] MongoDB updated ${result.modifiedCount} batch document(s)`);
            res.json({
                message: 'Degrees updated globally for all batches',
                modifiedCount: result.modifiedCount,
                degrees
            });
        } catch (error) {
            console.error('[BatchSettingsController] updateAllDegrees error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ---------------------------------------------------------------------
    // End of Degree Endpoints
    // ---------------------------------------------------------------------

}

module.exports = BatchSettingsController;
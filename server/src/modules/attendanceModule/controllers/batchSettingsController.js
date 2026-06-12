const Batch = require('../../../models/attendanceModule/batch');

class BatchSettingsController {
    async listBatches(req, res) {
        try {
            const filter = {};
            if (req.params.dept) {
                filter.department = req.params.dept;
            }
            const batches = await Batch.find(filter).sort({ department: 1, batchYear: -1, program: 1 });
            res.json({ batches });
        } catch (error) {
            console.error('[BatchSettingsController] listBatches error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createBatch(req, res) {
        try {
            const { department, program, batchYear } = req.body;
            if (!department || !program || !batchYear) {
                return res.status(400).json({ error: 'Department, program, and batch year are required' });
            }

            const existing = await Batch.findOne({ department, program, batchYear });
            if (existing) {
                return res.status(409).json({ error: 'Batch already exists for this department, program, and year' });
            }

            const batch = new Batch({ department, program, batchYear });
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
            const { department, program, batchYear } = req.body;
            const batch = await Batch.findById(req.params.id);
            
            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            if (department) batch.department = department;
            if (program) batch.program = program;
            if (batchYear) batch.batchYear = batchYear;

            // Check for conflicts
            const conflict = await Batch.findOne({ 
                department: batch.department, 
                program: batch.program, 
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
}

module.exports = BatchSettingsController;

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
            const { batchYear, degrees } = req.body;
            if (!batchYear) {
                return res.status(400).json({ error: 'Batch year is required' });
            }

            // Validate degrees if provided
            if (degrees !== undefined) {
                if (!Array.isArray(degrees)) {
                    return res.status(400).json({ error: '`degrees` must be an array' });
                }
                for (const d of degrees) {
                    if (typeof d.degreeName !== 'string' || !Array.isArray(d.branches)) {
                        return res.status(400).json({ error: 'Each degree must have a string `degreeName` and an array `branches`' });
                    }
                    //  ensure branches are strings
                    for (const b of d.branches) {
                        if (typeof b !== 'string') {
                            return res.status(400).json({ error: 'Branch names must be strings' });
                        }
                    }
                }
            }

            const existing = await Batch.findOne({ batchYear });
            if (existing) {
                return res.status(409).json({ error: 'Batch already exists for this year' });
            }

            const batch = new Batch({ batchYear, degrees });
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
            const { batchYear, degrees } = req.body;

            const batch = await Batch.findById(req.params.id);

            if (!batch) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            if (batchYear) {
                batch.batchYear = batchYear;
            }

            if (degrees) {
                batch.degrees = degrees;
            }

            const conflict = await Batch.findOne({
                batchYear: batch.batchYear,
                _id: { $ne: batch._id }
            });

            if (conflict) {
                return res.status(409).json({
                    error: 'Another batch already exists with these details'
                });
            }

            await batch.save();

            res.json({
                message: 'Batch updated successfully',
                batch
            });

        } catch (error) {
            console.error('[BatchSettingsController] updateBatch error:', error);

            res.status(500).json({
                error: 'Internal server error'
            });
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

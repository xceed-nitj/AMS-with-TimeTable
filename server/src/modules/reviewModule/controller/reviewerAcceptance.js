const Paper = require("../../../models/reviewModule/paper");

const updateReviewerAcceptanceStatus = async (req, res) => {
    const { paperId, status } = req.body;

    try {
        // Find the paper by its paperId (assuming paperId is the filename)
        const paper = await Paper.findOne({ paperId });

        if (!paper) {
            return res.status(404).json({ success: false, message: 'Paper not found.' });
        }

        // Update the paper status
        paper.status = status;
        await paper.save();

        return res.status(200).json({ success: true, message: 'Reviewer acceptance status updated successfully.' });
    } catch (error) {
        console.error('Error updating reviewer acceptance status:', error);
        return res.status(500).json({ success: false, message: 'Internal server error occurred while updating paper status.' });
    }
};

module.exports = { updateReviewerAcceptanceStatus };

const ReviewerAcceptance = require('../../../models/reviewModule/reviewerAcceptance');

const updateReviewerAcceptanceStatus = async (req, res) => {
    const { paperId, status } = req.body;

    try {
        // Update the reviewer acceptance status in the database
        await ReviewerAcceptance.updateOne({ paperId }, { status });

        res.status(200).json({ success: true, message: 'Reviewer acceptance status updated successfully.' });
    } catch (error) {
        console.error('Error updating reviewer acceptance status:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = { updateReviewerAcceptanceStatus };

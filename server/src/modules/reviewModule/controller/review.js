const Review = require("../../../models/reviewModule/review");

const addReview = async (req, res) => {
    const { paperId, eventId, reviewerId, reviewans, commentsAuthor, commentsEditor, decision } = req.body;

    try {
        const newReview = new Review({
            paperId,
            eventId,
            reviewerId,
            reviewans,
            commentsAuthor,
            commentsEditor,
            decision
        });
        await newReview.save();
        res.status(201).json(newReview);
    } catch (error) {
        res.status(500).json({ message: "Error creating review", error });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate('paperId eventId reviewerId');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error });
    }
};

const getReviewById = async (req, res) => {
    const { id } = req.params;
    try {
        const review = await Review.findById(id).populate('paperId eventId reviewerId');
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review", error });
    }
};

const updateReview = async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;

    try {
        const updatedReview = await Review.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedReview) return res.status(404).json({ message: "Review not found" });
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: "Error updating review", error });
    }
};

const deleteReview = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedReview = await Review.findByIdAndDelete(id);
        if (!deletedReview) return res.status(404).json({ message: "Review not found" });
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review", error });
    }
};

module.exports = { addReview, getReviews, getReviewById, updateReview, deleteReview };

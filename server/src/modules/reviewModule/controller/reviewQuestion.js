const ReviewQuestion = require("../../../models/reviewModule/reviewQuestion");
const Event = require("../../../models/reviewModule/event.js");
const Paper = require("../../../models/reviewModule/paper.js");

const addReviewQuestion = async (req, res) => {
    const { eventId,show, type, question, options } = req.body;

    try {
        const newReviewQuestion = new ReviewQuestion({
            eventId,
            
            show,
            type,
            question,
            options
        });
        await newReviewQuestion.save();
        res.status(201).json(newReviewQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error creating review question", error });
    }
};

const getReviewQuestions = async (req, res) => {
    try {
        const reviewQuestions = await ReviewQuestion.find().populate('eventId');
        res.status(200).json(reviewQuestions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review questions", error });
    }
};

const getReviewQuestionsByEventId = async (req, res) => {
    const { eventId } = req.params;
    try {
        const reviewQuestions = await ReviewQuestion.find({ eventId }).populate('eventId');
        res.status(200).json(reviewQuestions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review questions", error });
    }
};

const getReviewQuestionById = async (req, res) => {
    const { id } = req.params;
    try {
        const reviewQuestion = await ReviewQuestion.findById(id).populate('eventId');
        if (!reviewQuestion) return res.status(404).json({ message: "Review question not found" });
        res.status(200).json(reviewQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review question", error });
    }
};

const updateReviewQuestion = async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;

    try {
        const updatedReviewQuestion = await ReviewQuestion.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedReviewQuestion) return res.status(404).json({ message: "Review question not found" });
        res.status(200).json(updatedReviewQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error updating review question", error });
    }
};

const deleteReviewQuestion = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedReviewQuestion = await ReviewQuestion.findByIdAndDelete(id);
        if (!deletedReviewQuestion) return res.status(404).json({ message: "Review question not found" });
        res.status(200).json({ message: "Review question deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review question", error });
    }
};

const getReviewQuestionsByEventIdAndPaperId = async (req, res) => {
    const { eventId, paperId } = req.params;
    try {
        
        const reviewQuestions = await ReviewQuestion.find({ eventId: eventId, paperId: paperId});
        res.status(200).json(reviewQuestions);
    } catch (error) { 
        //console.error("Error fetching review questions:", error); // Log the error to the console
        res.status(500).json({ message: "Error fetching review questions", error: error.message });
    }
};

module.exports = { addReviewQuestion, getReviewQuestionsByEventId , getReviewQuestions, getReviewQuestionById, updateReviewQuestion, deleteReviewQuestion,getReviewQuestionsByEventIdAndPaperId };

const mongoose = require('mongoose'); 
const ReviewQuestion = require("../../../models/reviewModule/reviewQuestion");
const Event = require("../../../models/reviewModule/event.js");
const Paper = require("../../../models/reviewModule/paper.js");
const DefaultQuestion =require("../../../models/reviewModule/defaultQuestion.js")

const addReviewQuestion = async (req, res) => {
    const { eventId,show, type, question, options,order } = req.body;

    try {
        const newReviewQuestion = new ReviewQuestion({
            eventId,
            
            show,
            type,
            question,
            options,
            order
        });
        await newReviewQuestion.save();
        res.status(201).json(newReviewQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error creating review question", error });
    }
};

const getReviewQuestions = async (req, res) => {
    try {
        const reviewQuestions = await ReviewQuestion.find();
        res.status(200).json(reviewQuestions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review questions", error });
    }
};

const getReviewQuestionsByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Validate and convert eventId to ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid eventId format" });
        }
        const objectId = mongoose.Types.ObjectId(eventId);

        const questions = await ReviewQuestion.find({ eventId: objectId });

        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: "No questions found for this event." });
        }

        res.status(200).json(questions);
    } catch (error) {
        console.error("Error fetching questions by eventId:", error);
        res.status(500).json({ message: "Server error while fetching questions.", error: error.message });
    }
};

const getReviewQuestionById = async (req, res) => {
    const { id } = req.params;
    try {
        const reviewQuestion = await ReviewQuestion.findById(id);
        if (!reviewQuestion) return res.status(404).json({ message: "Review question not found" });
        res.status(200).json(reviewQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review question", error });
    }
};

const getQuestionsByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Log the eventId
       // console.log(`Received eventId: ${eventId}`);

        // Validate the eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            console.log('Invalid eventId');
            return res.status(400).json({ message: "Invalid eventId" });
        }
        const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.defaultQuestionsAdded) {
      const defaultQuestions = await DefaultQuestion.find();
      const reviewQuestions = defaultQuestions.map(defaultQuestion => ({
        eventId: event._id,
        show: defaultQuestion.show,
        type: defaultQuestion.type,
        question: defaultQuestion.question,
        options: defaultQuestion.options,
        order: defaultQuestion.order,
      }));

      await ReviewQuestion.insertMany(reviewQuestions);
      event.defaultQuestionsAdded = true;
      await event.save();
    }


        // Find the review questions by eventId
        const questions = await ReviewQuestion.find({ eventId });

        // Log the number of questions found
       // console.log(`Number of questions found: ${questions.length}`);

        if (!questions.length) {
            return res.status(404).json({ message: "Review question not found" });
        }

        res.status(200).json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const updateReviewQuestion = async (req, res) => {
    console.log('Attempting to update question..')
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
    console.log('attempting to delete review question')
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

module.exports = { addReviewQuestion, getReviewQuestionsByEventId , getReviewQuestions, getReviewQuestionById, updateReviewQuestion, deleteReviewQuestion,getReviewQuestionsByEventIdAndPaperId ,getQuestionsByEventId };

const express = require("express");
const quizRouter = express.Router();
const QuizController = require('../controllers/quiz');
const quizController = new QuizController();
const { quizBelongsToUser } = require('../controllers/helper');
// const facultyRoute = require("../../../usermanagement/facultyroute");
const { checkRole } = require("../../../checkRole.middleware");

quizRouter.post("/",checkRole(['FACULTY']), async (req, res) => {
    try { 
        await quizController.createQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


quizRouter.get("/quizzes", checkRole(['FACULTY']), async (req, res) => {
    try {
        await quizController.getAllQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code", checkRole(['FACULTY']), async (req, res) => {
    try {
        await quizController.getQuizByCode(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.put("/:code", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.editQuizByCode(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.delete("/:code", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.deleteQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

// Questions

quizRouter.post("/:code/questions", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.addQuizQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.put("/:code/questions/:id", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.editQuizQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code/questions", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.getAllQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code/questions/:id", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.findQuestionById(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.delete("/:code/questions/:id", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.deleteQuizQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


// testing pending 

quizRouter.delete("/:code/response", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.deleteQuizResponse(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


quizRouter.get("/:code/results/summary", checkRole(['FACULTY']), quizBelongsToUser, async (req, res) => {
    try {
        await quizController.studentResultSummary(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


module.exports = quizRouter;

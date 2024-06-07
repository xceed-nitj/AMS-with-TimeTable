const express = require("express");
const quizRouter = express.Router();
const QuizController = require('../controllers/quiz');
const quizController = new QuizController();
const { quizBelongsToUser } = require('../controllers/helper');
const facultyRoute = require("../../../usermanagement/facultyroute");

quizRouter.post("/",facultyRoute, async (req, res) => {
    try { 
        await quizController.createQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


quizRouter.get("/quizzes", facultyRoute, async (req, res) => {
    try {
        await quizController.getAllQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code", facultyRoute, async (req, res) => {
    try {
        await quizController.getQuizByCode(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.put("/:code", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.editQuizByCode(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.delete("/:code", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.deleteQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

// Questions

quizRouter.post("/:code/questions", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.addQuizQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.put("/:code/questions/:id", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.editQuizQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code/questions", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.getAllQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code/questions/:id", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.getAQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.delete("/:code/questions/:id", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.deleteQuizQuestion(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


// testing pending 

quizRouter.delete("/:code/response", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.deleteQuizResponse(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


quizRouter.get("/:code/results/summary", facultyRoute, quizBelongsToUser, async (req, res) => {
    try {
        await quizController.studentResultSummary(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});


module.exports = quizRouter;

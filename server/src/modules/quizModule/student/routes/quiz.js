const express = require('express');
const quizRouter = express.Router();
const QuizController = require('../controllers/quiz');
const quizController = new QuizController();
const studentRoute = require('../../../usermanagement/studentRoute');
const { quizBelongsToUser } = require('../../faculty/controllers/helper');

quizRouter.get(`/quizzes`, studentRoute, async (req, res) => {
    try {
        await quizController.getStudentQuiz(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get("/:code", studentRoute, async (req, res) => {
    try {
        await quizController.getFirstQuestion(req, res);
    } catch(e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.post(`/:code/:currentIndex`, studentRoute, async (req, res) => {
    try {
        await quizController.saveAnsAndGetQues(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

quizRouter.get(`/:code/result`, studentRoute, async (req, res) => {
    try {
        await quizController.getStudentResult(req, res);
    } catch (e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

module.exports = quizRouter;


// // Uncomment and implement if needed
// router.post(`${baseUrl}/endquiz/:code`, authentication, async (req, res) => {
//     try {
//         await controller.endQuizAndCalculateScore(req, res);
//     } catch (e) {
//         res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
//     }
// });
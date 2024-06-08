const express = require('express');
const quizRouter = express.Router();
const QuizController = require('../controllers/quiz');
const quizController = new QuizController();
const studentRoute = require('../../../usermanagement/studentRoute');
const { quizBelongsToUser } = require('../../faculty/controllers/helper');

quizRouter.get("/:code", studentRoute, async (req, res) => {
    try {
        await quizController.getFirstQuestion(req, res);
    } catch(e) {
        res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    }
});

module.exports = quizRouter;

    // // Student answer routes
    // router.get('/studentanswer/:code', authentication, async (req, res) => {
    //     try {
    //         await controller.getFirstQuestion(req, res);
    //     } catch (e) {
    //         res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    //     }
    // });

    // router.post(`${baseUrl}/studentanswer/:code/:currentIndex`, authentication, async (req, res) => {
    //     try {
    //         await controller.saveAnswerAndGetNextQuestion(req, res);
    //     } catch (e) {
    //         res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    //     }
    // });

    // router.get(`${baseUrl}/studentresult/:code`, authentication, async (req, res) => {
    //     try {
    //         await controller.getStudentResult(req, res);
    //     } catch (e) {
    //         res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    //     }
    // });

    // router.get(`${baseUrl}/studentquiz`, authentication, async (req, res) => {
    //     try {
    //         await controller.getStudentQuiz(req, res);
    //     } catch (e) {
    //         res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    //     }
    // });

    // // Uncomment and implement if needed
    // router.post(`${baseUrl}/endquiz/:code`, authentication, async (req, res) => {
    //     try {
    //         await controller.endQuizAndCalculateScore(req, res);
    //     } catch (e) {
    //         res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
    //     }
    // });
const express = require("express");
const router = express.Router();
const facultyRoute = require("../../../usermanagement/facultyroute");

// quiz
router.use('/quiz', facultyRoute, require("./quiz"));
router.use('/quiz/quizzes', facultyRoute, require("./quiz"));
router.use('/quiz/:code', facultyRoute, require("./quiz"));

// questions
router.use('/quiz/:code/questions', facultyRoute, require("./quiz"));
router.use('/quiz/:code/questions/:id', facultyRoute, require("./quiz"));

// response
router.use('/quiz/:code/response', facultyRoute, require("./quiz"))
router.use('/quiz/:code/results/summary', facultyRoute, require("./quiz"))

module.exports = router;

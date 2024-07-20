const express = require("express");
const router = express.Router();
// const facultyRoute = require("../../../usermanagement/facultyroute");
const { checkRole } = require("../../../checkRole.middleware");

// quiz
router.use('/quiz', checkRole(['FACULTY']), require("./quiz"));
router.use('/quiz/quizzes', checkRole(['FACULTY']), require("./quiz"));
router.use('/quiz/:code', checkRole(['FACULTY']), require("./quiz"));

// questions
router.use('/quiz/:code/questions', checkRole(['FACULTY']), require("./quiz"));
router.use('/quiz/:code/questions/:id', checkRole(['FACULTY']), require("./quiz"));

// response
router.use('/quiz/:code/response', checkRole(['FACULTY']), require("./quiz"))
router.use('/quiz/:code/results/summary', checkRole(['FACULTY']), require("./quiz"))

module.exports = router;

const express = require('express');
const { addReviewQuestion, getReviewQuestionsByEventId ,getReviewQuestions,getReviewQuestionById, updateReviewQuestion, deleteReviewQuestion,getReviewQuestionsByEventIdAndPaperId ,getQuestionsByEventId } = require('../controller/reviewQuestion');
const protectRoute =require("../../usermanagement/privateroute")
const superAdminRoute=require("../../usermanagement/superadminroute")

const router = express.Router();

router.post('/add', addReviewQuestion);
router.get('/all', getReviewQuestions);
router.get('/:id', getReviewQuestionById);
router.get('/get/:eventId',getQuestionsByEventId);
router.get('/:eventId/:paperId',getReviewQuestionsByEventIdAndPaperId);
router.get('/event/:eventId', getReviewQuestionsByEventId);
router.patch('/:id', updateReviewQuestion);
router.delete('/:id', deleteReviewQuestion);

module.exports = router;

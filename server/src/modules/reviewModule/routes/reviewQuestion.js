const express = require('express');
const { addReviewQuestion, getReviewQuestionsByEventId ,getReviewQuestions,getReviewQuestionById, updateReviewQuestion, deleteReviewQuestion } = require('../controller/reviewQuestion');

const router = express.Router();

router.post('/add', addReviewQuestion);
router.get('/all', getReviewQuestions);
router.get('/:id', getReviewQuestionById);
router.get('/event/:eventId', getReviewQuestionsByEventId);
router.patch('/:id', updateReviewQuestion);
router.delete('/:id', deleteReviewQuestion);

module.exports = router;

const express = require('express');
const { addReviewQuestion, getReviewQuestions, getReviewQuestionById, updateReviewQuestion, deleteReviewQuestion } = require('../controller/reviewQuestion');

const router = express.Router();

router.post('/add', addReviewQuestion);
router.get('/all', getReviewQuestions);
router.get('/:id', getReviewQuestionById);
router.patch('/:id', updateReviewQuestion);
router.delete('/:id', deleteReviewQuestion);

module.exports = router;

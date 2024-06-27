const express = require('express');
const { addReview, getAnswersByEVentIdPaperId,getAnswers,getReviews,submitReview ,getReviewById, updateReview, deleteReview,getReviewsByEventPaperUser ,deleteReviewByPaperEventUser} = require('../controller/review');

const router = express.Router();

router.post('/add', addReview);
router.post('/save',submitReview);
router.get('/all', getReviews);
router.get('/get/:eventId/:paperId/:userId',getReviewsByEventPaperUser);
router.get('/get/:eventId/:paperId', getAnswersByEVentIdPaperId);
router.get('/getAnswers/:eventId/:paperId/:userId',getAnswers)
router.get('/:id', getReviewById);
router.delete('/delete/:eventId/:paperId/:userId',deleteReviewByPaperEventUser);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;

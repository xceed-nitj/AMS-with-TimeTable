const express = require('express');
const { addReview, getAnswersByEVentIdPaperId,getAnswers,getReviews,submitReview ,getReviewById, updateReview, deleteReview,getReviewsByEventPaperUser ,deleteReviewByPaperEventUser} = require('../controller/review');
const { checkRole } = require('../../checkRole.middleware');

const router = express.Router();

router.post('/add', checkRole(['admin']), addReview);
router.post('/save', checkRole(['admin']), submitReview);
router.get('/all', getReviews);
router.get('/get/:eventId/:paperId/:userId',getReviewsByEventPaperUser);
router.get('/get/:eventId/:paperId', getAnswersByEVentIdPaperId);
router.get('/getAnswers/:eventId/:paperId/:userId',getAnswers)
router.get('/:id', getReviewById);
router.delete('/delete/:eventId/:paperId/:userId', checkRole(['admin']), deleteReviewByPaperEventUser);
router.patch('/:id', checkRole(['admin']), updateReview);
router.delete('/:id', checkRole(['admin']), deleteReview);

module.exports = router;

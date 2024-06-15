const express = require('express');
const { addReview, getReviews, getReviewById, updateReview, deleteReview } = require('../controller/review');

const router = express.Router();

router.post('/add', addReview);
router.get('/all', getReviews);
router.get('/:id', getReviewById);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;

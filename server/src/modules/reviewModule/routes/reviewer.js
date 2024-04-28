const express = require('express');
// const { addReviewer, updateReviewer, deleteReviewer } = require('../controller/reviewer');
const { addReviewer, updateReviewer, deleteReviewer, getAllReviewers } = require('../controller/reviewer');

const router = express.Router();

router.get('/', getAllReviewers);
router.post('/addReviewer', addReviewer);
router.patch('/updateReview', updateReviewer);
router.delete('/deleteReviewer', deleteReviewer);

module.exports = router;
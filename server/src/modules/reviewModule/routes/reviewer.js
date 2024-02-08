const express = require('express');
const { addReviewer, updateReviewer, deleteReviewer } = require('../controller/reviewer');

const router = express.Router();

router.post('/addReviewer', addReviewer);
router.patch('/updateReview', updateReviewer);
router.patch('/deleteReviewer', deleteReviewer);

module.exports = router;
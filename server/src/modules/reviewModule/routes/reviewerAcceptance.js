const express = require('express');
const router = express.Router();
const { updateReviewerAcceptanceStatus } = require('../controller/reviewerAcceptance');

// Route to update reviewer acceptance status
router.post('/updateReviewerAcceptanceStatus', updateReviewerAcceptanceStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { updateReviewerAcceptanceStatus } = require('../controller/reviewerAcceptance');
const { checkRole } = require('../../checkRole.middleware');

// Route to update reviewer acceptance status
router.post('/updateStatus', checkRole(['admin']), updateReviewerAcceptanceStatus);

module.exports = router;

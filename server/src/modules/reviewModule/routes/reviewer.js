const express = require('express');
// const { addReviewer, updateReviewer, deleteReviewer } = require('../controller/reviewer');
const { addReviewer, updateReviewer, deleteReviewer, getAllReviewers } = require('../controller/reviewer');
const { checkRole } = require('../../checkRole.middleware');

const router = express.Router();

router.get('/', getAllReviewers);
router.post('/addReviewer', checkRole(['admin']), addReviewer);
router.patch('/updateReviewer/:paperid/:reviewerid', checkRole(['admin']), updateReviewer);
router.delete('/deleteReviewer', checkRole(['admin']), deleteReviewer);

module.exports = router;
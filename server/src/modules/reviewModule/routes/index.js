const express = require('express');
const path = require('path');
const fileUploadMiddleware = require('../controller/uploadFileMiddleWare.js');
const { findPaper, findAllPapers, updatePaper } = require('../controller/papers.js');
const uploadPaper = require('../controller/uploadFile.js');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

router.get('/papers', findAllPapers)
router.get('/paper/:id', findPaper)   // To find paper using paperId (not _id)
router.patch('/paper/:id', updatePaper)  // To update paper using paperId (not _id)
router.post('/upload', fileUploadMiddleware, uploadPaper);

router.use('/reviewer', require('./reviewer.js'));
router.use('/user', require('./user.js'));

module.exports = router;

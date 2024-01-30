const express = require('express');
const path = require('path');
const fileUploadMiddleware = require('../controller/uploadFile.js');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload using the middleware from the module
router.post('/upload', fileUploadMiddleware, (req, res) => {
  res.send('File uploaded!');
});

module.exports = router;

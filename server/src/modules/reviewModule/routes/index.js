const express = require('express');
const path = require('path');
const fileUploadMiddleware = require('../controller/uploadFile.js');

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload using the middleware from the module
app.post('/upload', fileUploadMiddleware, (req, res) => {
  res.send('File uploaded!');
});


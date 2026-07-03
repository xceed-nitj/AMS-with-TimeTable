// instituteGateRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const path = require('path');
const gateController = require('../controllers/instituteController');

// Set up multer to store uploaded files temporarily
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        cb(null, `gate-upload-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

router.post('/identify-video', upload.single('file'), gateController.identifyVideo);

module.exports = router;

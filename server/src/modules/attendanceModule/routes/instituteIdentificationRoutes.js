const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

// Configure multer to store files in memory as buffer
const upload = multer({ storage: multer.memoryStorage() });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8500';

router.post('/identify-video', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded.' });
        }

        // Set headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.setHeader('Content-Encoding', 'none'); // Tell compression middleware not to compress this response

        // Create form data to send to Python ML service
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Make a stream request to the python ML service
        const response = await axios.post(`${ML_SERVICE_URL}/identify-institute-video`, form, {
            headers: {
                ...form.getHeaders()
            },
            responseType: 'stream',
        });

        // Instead of pipe, handle data explicitly to ensure it gets flushed
        response.data.on('data', (chunk) => {
            res.write(chunk);
            // If compression middleware is used, it often provides a flush() method
            if (res.flush) {
                res.flush();
            }
        });

        response.data.on('end', () => {
            res.end();
        });

        // Handle errors from the python side
        response.data.on('error', (err) => {
            console.error('Error in stream from ML service:', err);
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream error from ML service' })}\n\n`);
            res.end();
        });

    } catch (err) {
        console.error('Error identifying video:', err.message);
        
        // If we haven't started streaming headers yet
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process video.' });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
            res.end();
        }
    }
});

module.exports = router;

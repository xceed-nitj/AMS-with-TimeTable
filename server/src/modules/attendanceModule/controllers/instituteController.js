// instituteGateController.js
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const getEnvironmentURL = require("../../../getEnvironmentURL");

const identifyVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // The python ML service runs on port 8500 by default in this project
        // Or get from env. We'll use 8500 directly since we don't have a reliable env variable for it in this controller easily.
        // Or better, let's use the standard ml_service url if there's one.
        const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

        // Set headers for SSE response from our side
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await axios({
            method: 'post',
            url: `${ML_URL}/institute-gate-identify-video`,
            data: formData,
            headers: {
                ...formData.getHeaders(),
            },
            responseType: 'stream',
        });

        response.data.on('data', (chunk) => {
            res.write(chunk);
        });

        response.data.on('end', () => {
            res.end();
            // Cleanup uploaded file
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        });

        response.data.on('error', (err) => {
            console.error("Stream error:", err);
            res.end();
        });

    } catch (error) {
        console.error("Error in instituteGateController:", error.message);
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ error: 'Failed to process video' });
    }
};

module.exports = {
    identifyVideo,
};

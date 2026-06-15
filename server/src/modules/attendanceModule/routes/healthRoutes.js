const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const mlClient = require('../controllers/mlServiceClient');

async function getHealthStatus() {
    const response = {
        timestamp: new Date().toISOString(),
        services: {
            server: {
                status: 'online',
                uptime: Math.floor(process.uptime())
            },
            database: {
                status: 'offline'
            },
            ml: {
                status: 'offline',
                latency: null
            },
            tunnel: {
                status: 'not_configured'
            }
        }
    };

    // Database check
    if (mongoose.connection.readyState === 1) {
        response.services.database.status = 'online';
    }

    // ML Service check
    const mlStart = Date.now();
    try {
        await mlClient.healthCheck();
        response.services.ml.status = 'online';
        response.services.ml.latency = Date.now() - mlStart;
    } catch (error) {
        response.services.ml.status = 'offline';
    }

    return response;
}

router.get('/status', async (req, res) => {
    res.json(await getHealthStatus());
});

// Stream endpoint for real-time auto-updates via SSE
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Initial push
    getHealthStatus().then(status => {
        res.write(`data: ${JSON.stringify(status)}\n\n`);
    });

    // Poll every 2 seconds and push updates
    const intervalId = setInterval(async () => {
        const status = await getHealthStatus();
        res.write(`data: ${JSON.stringify(status)}\n\n`);
    }, 2000);

    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});

module.exports = router;

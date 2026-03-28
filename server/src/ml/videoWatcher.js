const chokidar = require('chokidar');
const path = require('path');
const mlClient = require('./mlServiceClient');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const VIDEO_FOLDER = process.env.VIDEO_FOLDER || path.join(__dirname, '../../../../classroom-videos');
const EXTERNAL_SERVER_URL = process.env.EXTERNAL_SERVER_URL;
const SETTLE_DELAY_MS = parseInt(process.env.SETTLE_DELAY_MS) || 10000;

async function processVideoFile(videoPath) {
    console.log(`[ML] Sending video to ML Service: ${videoPath}`);
    try {
        const result = await mlClient.processVideo(videoPath, {
            threshold: 0.45,
            frameSkip: 10,
            minDetections: 3
        });
        console.log(`[ML] Success! Attendance JSON received.`);
        
        if (EXTERNAL_SERVER_URL) {
            try {
                await axios.post(EXTERNAL_SERVER_URL, result);
                console.log(`[ML] Forwarded results to ${EXTERNAL_SERVER_URL}`);
            } catch (e) {
                console.error(`[ML] Failed to forward to external server: ${e.message}`);
            }
        }
        return result;
    } catch (err) {
        console.error(`[ML] Video processing failed:`, err.message);
        throw err;
    }
}

function startWatching() {
    console.log(`[ML Watcher] Starting to watch folder: ${VIDEO_FOLDER}`);
    const watcher = chokidar.watch(VIDEO_FOLDER, {
        ignored: /(^|[\/\\])\../, 
        persistent: true,
        awaitWriteFinish: {
            stabilityThreshold: 5000,
            pollInterval: 1000
        }
    });

    watcher.on('add', async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (['.mp4', '.avi', '.mkv', '.mov', '.webm'].includes(ext)) {
            console.log(`[ML Watcher] New video detected: ${filePath}`);
            console.log(`[ML Watcher] Waiting ${SETTLE_DELAY_MS}ms for settle delay...`);
            setTimeout(async () => {
                try {
                    await processVideoFile(filePath);
                } catch (e) {
                    console.error(`[ML Watcher] Processing failed for ${filePath}: ${e.message}`);
                }
            }, SETTLE_DELAY_MS);
        }
    });
}

module.exports = { startWatching, processVideoFile };

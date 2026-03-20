const chokidar = require('chokidar');
const path = require('path');
const mlClient = require('./mlServiceClient');

const VIDEO_FOLDER = process.env.VIDEO_FOLDER || path.join(__dirname, '../../../../classroom-videos');
const SETTLE_DELAY_MS = parseInt(process.env.SETTLE_DELAY_MS) || 10000;
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.webm'];

async function processVideoFile(videoPath) {
    console.log(`[ML] Processing video: ${videoPath}`);
    try {
        const result = await mlClient.processVideo(videoPath);
        console.log(`[ML] Done - Present: ${result.total_present}/${result.total_enrolled}`);
        console.log(`[ML] Attendance JSON:`, JSON.stringify(result, null, 2));
        return result;
    } catch (err) {
        console.error(`[ML] Processing failed:`, err.message);
        throw err;
    }
}

function startWatching() {
    console.log(`[ML] Watching folder: ${VIDEO_FOLDER}`);

    const watcher = chokidar.watch(VIDEO_FOLDER, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 5000,
            pollInterval: 1000
        }
    });

    watcher.on('add', async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (!VIDEO_EXTENSIONS.includes(ext)) return;

        console.log(`[ML] New video detected: ${filePath}`);
        await new Promise(r => setTimeout(r, SETTLE_DELAY_MS));

        try {
            await processVideoFile(filePath);
        } catch (err) {
            console.error(`[ML] Error processing ${filePath}:`, err.message);
        }
    });

    watcher.on('error', err => console.error(`[ML] Watcher error:`, err));
}

module.exports = { startWatching, processVideoFile };
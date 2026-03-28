const chokidar = require('chokidar');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const VIDEO_FOLDER = process.env.VIDEO_FOLDER ||
    path.join(__dirname, '../classroom-videos');

const GROUND_TRUTH_FOLDER = path.join(
    __dirname, '..', '..', '..', '..', '..',
    'client', 'public', 'ground-truth'
);

const ROLL_LISTS_DIR = path.join(__dirname, '../roll-lists');
const SETTLE_DELAY_MS = parseInt(process.env.SETTLE_DELAY_MS) || 10000;
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.webm'];
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

// ── Get roll list for course from saved file ──
function getRollList(courseCode) {
    if (!courseCode) return [];
    const savePath = path.join(ROLL_LISTS_DIR, `${courseCode}.json`);
    if (!fs.existsSync(savePath)) {
        console.log(`[ML] No roll list found for course: ${courseCode}`);
        return [];
    }
    const data = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    console.log(`[ML] Loaded roll list for ${courseCode}: ${data.rollList.length} students`);
    return data.rollList;
}

// ── Extract course code from video filename ──
// Expected format: COURSECODE_date_time.mp4
// Example: ECE301_2026_03_22_0900.mp4
function getCourseCode(videoPath) {
    const filename = path.basename(videoPath, path.extname(videoPath));
    const parts = filename.split('_');
    return parts[0]; // first part = course code
}

// ── Auto build embeddings when photos added ──
async function buildEmbeddings() {
    console.log('[ML] New photos detected — rebuilding embeddings DB...');
    try {
        const result = await axios.post(
            `${ML_URL}/build-embeddings-sync`,
            {
                photos_dir: GROUND_TRUTH_FOLDER,
                output_path: path.join(
                    __dirname, '../../../python-ml-service/embeddings_db.pkl'
                )
            },
            { timeout: 300000 }
        );

        console.log(`[ML] ✅ Embeddings rebuilt — ${result.data.students_enrolled} students enrolled`);
        await axios.post(`${ML_URL}/reload-embeddings`);
        console.log('[ML] ✅ Embeddings reloaded in ML service');

    } catch (err) {
        console.error('[ML] Failed to rebuild embeddings:', err.message);
    }
}

// ── Process video with clustering + roll list comparison ──
async function processVideoFile(videoPath) {
    console.log(`[ML] Processing video: ${videoPath}`);

    // get course code from filename
    const courseCode = getCourseCode(videoPath);
    console.log(`[ML] Course code: ${courseCode}`);

    // get saved roll list for this course
    const rollList = getRollList(courseCode);

    try {
        const result = await axios.post(
            `${ML_URL}/process-video-clustering`,
            {
                videoPath,
                frame_skip:             10,
                cluster_threshold:      0.45,
                min_samples:            2,
                auto_present_threshold: 0.60,
                review_threshold:       0.40,
                output_dir:             path.join(__dirname, '../clustering_output'),
                roll_list:              rollList
            },
            { timeout: 600000 }
        );

        const data = result.data;
        const summary = data.summary;

        console.log(`\n[ML] ✅ Processing Complete!`);
        console.log(`[ML] Course:   ${courseCode}`);
        console.log(`[ML] Video:    ${path.basename(videoPath)}`);
        console.log(`[ML] ─────────────────────────`);
        console.log(`[ML] Present:      ${summary.present}`);
        console.log(`[ML] Absent:       ${summary.absent}`);
        console.log(`[ML] Review:       ${summary.review}  ← needs confirmation`);
        console.log(`[ML] Unknown:      ${summary.unknown_faces}`);
        if (rollList.length > 0) {
            console.log(`[ML] Not Enrolled: ${summary.not_enrolled || 0}`);
        }
        console.log(`[ML] Folders:      ${data.output_dir}`);

        // log flagged students
        if (summary.review > 0) {
            console.log(`\n[ML] ⚠️ FLAGGED — needs manual confirmation:`);
            Object.entries(data.attendance || {}).forEach(([sid, info]) => {
                if (info.status === 'review') {
                    console.log(`[ML]   → ${sid} (${info.name})`);
                    console.log(`[ML]     Confidence: ${(info.avg_confidence * 100).toFixed(1)}%`);
                    console.log(`[ML]     Photos: ${data.output_dir}/${info.cluster_folder}`);
                }
            });
        }

        // log unknown faces
        if (summary.unknown_faces > 0) {
            console.log(`\n[ML] 👤 UNKNOWN FACES (not in DB):`);
            (data.clusters || []).forEach(cluster => {
                if (cluster.status === 'unknown') {
                    console.log(`[ML]   → cluster_${cluster.cluster_id}`);
                    console.log(`[ML]     Detections: ${cluster.detection_count}`);
                    console.log(`[ML]     Photos: ${data.output_dir}/${cluster.folder_name}`);
                }
            });
        }

        // log not enrolled (in roll list but no photos)
        if (rollList.length > 0 && data.comparison) {
            const notEnrolled = data.comparison.filter(s => s.status === 'not_enrolled');
            if (notEnrolled.length > 0) {
                console.log(`\n[ML] 🟠 NOT ENROLLED (in roll list but no photos):`);
                notEnrolled.forEach(s => {
                    console.log(`[ML]   → ${s.roll_no}`);
                });
            }
        }

        return data;

    } catch (err) {
        console.error(`[ML] Processing failed:`, err.message);
        throw err;
    }
}

// ── Start watching both folders ──
function startWatching() {
    console.log(`[ML] Watching videos: ${VIDEO_FOLDER}`);
    console.log(`[ML] Watching photos: ${GROUND_TRUTH_FOLDER}`);

    // Watch classroom-videos/ for new videos
    const videoWatcher = chokidar.watch(VIDEO_FOLDER, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 5000,
            pollInterval: 1000
        }
    });

    videoWatcher.on('add', async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (!VIDEO_EXTENSIONS.includes(ext)) return;

        console.log(`[ML] New video detected: ${filePath}`);
        await new Promise(r => setTimeout(r, SETTLE_DELAY_MS));

        try {
            await processVideoFile(filePath);
        } catch (err) {
            console.error(`[ML] Error:`, err.message);
        }
    });

    // Watch ground-truth/ for new student photos
    const photoWatcher = chokidar.watch(GROUND_TRUTH_FOLDER, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 3000,
            pollInterval: 500
        },
        depth: 2
    });

    let rebuildTimer = null;

    photoWatcher.on('add', (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (!PHOTO_EXTENSIONS.includes(ext)) return;

        console.log(`[ML] New photo detected: ${filePath}`);

        // debounce — rebuild once after all photos added
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(async () => {
            await buildEmbeddings();
        }, 5000);
    });

    videoWatcher.on('error', err => console.error(`[ML] Video watcher error:`, err));
    photoWatcher.on('error', err => console.error(`[ML] Photo watcher error:`, err));
}

module.exports = { startWatching, processVideoFile };

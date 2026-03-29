const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const mlClient = require('../controllers/mlServiceClient');
const { processVideoFile } = require('../controllers/videoWatcher');
const mlProcess = require('../controllers/mlProcessController');

const ML_URL = 'http://localhost:8500';

// ─── Roll Lists Directory ─────────────────────────────────────
const ROLL_LISTS_DIR = path.join(__dirname, '../roll-lists');
if (!fs.existsSync(ROLL_LISTS_DIR)) {
    fs.mkdirSync(ROLL_LISTS_DIR, { recursive: true });
}

// ─── Clustering Output Directory ──────────────────────────────
const CLUSTERING_OUTPUT = path.join(__dirname, '../clustering_output');
if (!fs.existsSync(CLUSTERING_OUTPUT)) {
    fs.mkdirSync(CLUSTERING_OUTPUT, { recursive: true });
}

// ─── Multer Setup ─────────────────────────────────────────────
const upload = multer({
    dest: path.join(__dirname, '../uploads/'),
    fileFilter: (req, file, cb) => {
        if (
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls') ||
            file.originalname.endsWith('.csv')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel or CSV files allowed'));
        }
    }
});

// ─── Helper: Parse Excel/CSV → Roll Number List ───────────────
function parseRollList(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headerRow = rows[0]?.map(h => h?.toString().toLowerCase().trim());
    let rollColIndex = 0;

    if (headerRow) {
        const found = headerRow.findIndex(h =>
            ['roll_no', 'rollno', 'roll', 'id',
             'student_id', 'enrollment', 'enroll_no'].includes(h)
        );
        if (found !== -1) rollColIndex = found;
    }

    const rollList = [];
    const startRow = headerRow ? 1 : 0;
    for (let i = startRow; i < rows.length; i++) {
        const val = rows[i][rollColIndex];
        if (val !== undefined && val !== null && val !== '') {
            rollList.push(val.toString().trim());
        }
    }
    return rollList;
}

// ─── Helper: Pipe SSE Stream from Python to Frontend ──────────
async function pipeStream(pythonEndpoint, body, res) {
    try {
        const result = await axios.post(
            `${ML_URL}/${pythonEndpoint}`,
            body,
            { timeout: 600000, responseType: 'stream' }
        );
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Accel-Buffering', 'no');
        result.data.pipe(res);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// ─── ML Service Health ────────────────────────────────────────
router.get('/health', async (req, res) => {
    try {
        res.json(await mlClient.healthCheck());
    } catch (e) {
        res.status(503).json({ status: 'unreachable' });
    }
});

// ─── ML Service Status ────────────────────────────────────────
router.get('/status', (req, res) => {
    res.json(mlProcess.getStatus());
});

// ─── Python Process Control ───────────────────────────────────
router.post('/start', async (req, res) => {
    try {
        res.json(await mlProcess.startPython());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/stop', async (req, res) => {
    try {
        res.json(await mlProcess.stopPython());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/restart', async (req, res) => {
    try {
        res.json(await mlProcess.restartPython());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Enrolled Students ────────────────────────────────────────
router.get('/enrolled-students', async (req, res) => {
    try {
        const result = await axios.get(`${ML_URL}/enrolled-students`);
        res.json(result.data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Reload Embeddings ────────────────────────────────────────
router.post('/reload-embeddings', async (req, res) => {
    try {
        res.json(await mlClient.reloadEmbeddings());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Process Video (simple) ───────────────────────────────────
router.post('/process-video', async (req, res) => {
    const { videoPath } = req.body;
    if (!videoPath) return res.status(400).json({ error: 'videoPath required' });
    try {
        res.json(await processVideoFile(videoPath));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Process Video with Roll List ────────────────────────────
router.post('/process-with-rolllist', upload.single('rollList'), async (req, res) => {
    const { videoPath, threshold, frameSkip, autoThreshold, reviewThreshold } = req.body;

    if (!videoPath) {
        return res.status(400).json({ error: 'videoPath required' });
    }

    try {
        let rollList = [];
        if (req.file) {
            rollList = parseRollList(req.file.path);
            console.log(`[ML] Parsed ${rollList.length} roll numbers`);
            fs.unlinkSync(req.file.path);
        }

        const result = await axios.post(
            `${ML_URL}/process-video-with-rolllist`,
            {
                videoPath,
                threshold:              parseFloat(threshold)      || 0.45,
                frame_skip:             parseInt(frameSkip)         || 10,
                roll_list:              rollList,
                auto_present_threshold: parseFloat(autoThreshold)  || 0.60,
                review_threshold:       parseFloat(reviewThreshold) || 0.40
            },
            { timeout: 600000 }
        );

        res.json(result.data);
    } catch (err) {
        console.error('[ML] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── Process Video Clustering — live SSE progress stream ─────
router.post('/process-clustering-stream', upload.single('rollList'), async (req, res) => {
    const {
        videoPath, frameSkip, clusterThreshold,
        minSamples, autoThreshold, reviewThreshold
    } = req.body;

    if (!videoPath) {
        return res.status(400).json({ error: 'videoPath required' });
    }

    let rollList = [];
    if (req.file) {
        rollList = parseRollList(req.file.path);
        fs.unlinkSync(req.file.path);
    }

    await pipeStream('process-video-clustering-stream', {
        videoPath,
        frame_skip:             parseInt(frameSkip)          || 10,
        cluster_threshold:      parseFloat(clusterThreshold) || 0.45,
        min_samples:            parseInt(minSamples)          || 2,
        auto_present_threshold: parseFloat(autoThreshold)    || 0.60,
        review_threshold:       parseFloat(reviewThreshold)  || 0.40,
        roll_list:              rollList,
        output_dir:             CLUSTERING_OUTPUT
    }, res);
});

// ─── Process Video with Clustering ───────────────────────────
router.post('/process-clustering', upload.single('rollList'), async (req, res) => {
    const {
        videoPath, frameSkip, clusterThreshold,
        minSamples, autoThreshold, reviewThreshold
    } = req.body;

    if (!videoPath) {
        return res.status(400).json({ error: 'videoPath required' });
    }

    try {
        let rollList = [];
        if (req.file) {
            rollList = parseRollList(req.file.path);
            fs.unlinkSync(req.file.path);
        }

        const result = await axios.post(
            `${ML_URL}/process-video-clustering`,
            {
                videoPath,
                frame_skip:             parseInt(frameSkip)          || 10,
                cluster_threshold:      parseFloat(clusterThreshold) || 0.45,
                min_samples:            parseInt(minSamples)          || 2,
                auto_present_threshold: parseFloat(autoThreshold)    || 0.60,
                review_threshold:       parseFloat(reviewThreshold)  || 0.40,
                roll_list:              rollList,
                output_dir:             CLUSTERING_OUTPUT
            },
            { timeout: 600000 }
        );

        res.json(result.data);
    } catch (err) {
        console.error('[ML] Clustering error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── Upload Roll List Once Per Course ─────────────────────────
router.post('/upload-rolllist/:courseCode', upload.single('rollList'), async (req, res) => {
    const { courseCode } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: 'Excel file required' });
    }

    try {
        const rollList = parseRollList(req.file.path);
        fs.unlinkSync(req.file.path);

        const savePath = path.join(ROLL_LISTS_DIR, `${courseCode}.json`);
        fs.writeFileSync(savePath, JSON.stringify({
            courseCode,
            rollList,
            uploadedAt: new Date().toISOString(),
            totalStudents: rollList.length
        }, null, 2));

        console.log(`[ML] Roll list saved for ${courseCode}: ${rollList.length} students`);
        res.json({
            status: 'saved',
            courseCode,
            totalStudents: rollList.length,
            rollList
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Get Roll List for Course ─────────────────────────────────
router.get('/rolllist/:courseCode', (req, res) => {
    const { courseCode } = req.params;
    const savePath = path.join(ROLL_LISTS_DIR, `${courseCode}.json`);

    if (!fs.existsSync(savePath)) {
        return res.status(404).json({ error: 'No roll list found for this course' });
    }

    res.json(JSON.parse(fs.readFileSync(savePath, 'utf8')));
});

// ─── Get All Saved Roll Lists ─────────────────────────────────
router.get('/rolllists', (req, res) => {
    try {
        const files = fs.readdirSync(ROLL_LISTS_DIR)
            .filter(f => f.endsWith('.json'));

        const lists = files.map(f => {
            const data = JSON.parse(
                fs.readFileSync(path.join(ROLL_LISTS_DIR, f), 'utf8')
            );
            return {
                courseCode:    data.courseCode,
                totalStudents: data.totalStudents,
                uploadedAt:    data.uploadedAt
            };
        });

        res.json(lists);
    } catch (e) {
        res.json([]);
    }
});

// ─── Build Embeddings DB (streamed) ───────────────────────────
router.post('/build-embeddings', async (req, res) => {
    const { photosDir, outputPath } = req.body;
    await pipeStream('build-embeddings', {
        photos_dir:  photosDir  || '../ground-truth',
        output_path: outputPath || './embeddings_db.pkl'
    }, res);
});

// ─── Download LFW Dataset (streamed) ─────────────────────────
router.post('/download-dataset', async (req, res) => {
    const { outputDir, numStudents, minPhotos, enrollmentRatio } = req.body;
    await pipeStream('download-dataset', {
        output_dir:       outputDir                      || '../test-data',
        num_students:     parseInt(numStudents)          || 20,
        min_photos:       parseInt(minPhotos)            || 4,
        enrollment_ratio: parseFloat(enrollmentRatio)   || 0.6
    }, res);
});

// ─── Test Full Pipeline (streamed) ────────────────────────────
router.post('/test-pipeline', async (req, res) => {
    const { videoPath, groundTruthFile, threshold, frameSkip } = req.body;
    if (!videoPath) return res.status(400).json({ error: 'videoPath required' });
    await pipeStream('test-pipeline', {
        video_path:         videoPath,
        ground_truth_file:  groundTruthFile || '',
        threshold:          parseFloat(threshold) || 0.45,
        frame_skip:         parseInt(frameSkip)    || 10
    }, res);
});

module.exports = router;

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
const LockSem = require('../../../models/locksem');
const TimeTable = require('../../../models/timetable');

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
    // Set SSE headers BEFORE the axios call so the browser
    // receives them immediately without buffering.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    try {
        const result = await axios.post(
            `${ML_URL}/${pythonEndpoint}`,
            body,
            { timeout: 600000, responseType: 'stream', headers: { 'Content-Type': 'application/json' } }
        );
        result.data.pipe(res);
        result.data.on('error', () => { if (!res.writableEnded) res.end(); });
    } catch (e) {
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
            res.end();
        }
    }
}

// ─── Helper: LockSem lookup by room + slot ────────────────────
// Queries LockSem for today's day, matches room inside slotData,
// joins timetable to get dept/session, and returns context object.
async function lookupLocksem(room, slot, date) {
    try {
        // Get day-of-week from the date string (YYYY-MM-DD)
        const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        // Parse date as local time to avoid UTC offset shifting the day
const [y, m, d] = date.split('-').map(Number);
const dayName = DAYS[new Date(y, m - 1, d).getDay()];

        // Find all LockSem records for this slot + day that have this room in slotData
       // Match by slot + room only — do NOT filter by day.
        // The day field in LockSem may be empty or stored differently.
        // slot + room is sufficient to uniquely identify the class.
        let records = await LockSem.aggregate([
            {
                $match: {
                    slot: { $regex: new RegExp(`^${slot}$`, 'i') },
                    'slotData.room': { $regex: new RegExp(`^${room}$`, 'i') },
                }
            },
            {
                $lookup: {
                    from:         'timetables',
                    localField:   'timetable',
                    foreignField: '_id',
                    as:           'timetableData',
                }
            },
            { $unwind: { path: '$timetableData', preserveNullAndEmptyArrays: false } },
            { $match: { 'timetableData.currentSession': true } },
            { $limit: 1 }
        ]);

        // Fallback: if currentSession filter returns nothing, try without it
        if (!records.length) {
            records = await LockSem.aggregate([
                {
                    $match: {
                        slot: slot,
                        'slotData.room': { $regex: new RegExp(`^${room}$`, 'i') },
                    }
                },
                {
                    $lookup: {
                        from:         'timetables',
                        localField:   'timetable',
                        foreignField: '_id',
                        as:           'timetableData',
                    }
                },
                { $unwind: { path: '$timetableData', preserveNullAndEmpty: false } },
                { $limit: 1 }
            ]);
        }

        // Third fallback: timetable ObjectId ref is null — join via code field
        if (!records.length) {
            const rawRecs = await LockSem.find({
                slot: slot,
                'slotData.room': { $regex: new RegExp(`^${room}$`, 'i') },
            }).limit(5).lean();

            for (const raw of rawRecs) {
                if (raw.code) {
                    const tt2 = await TimeTable.findOne({ code: raw.code }).lean();
                    if (tt2) {
                        records = [{ ...raw, timetableData: tt2 }];
                        break;
                    }
                }
            }
        }

        if (!records.length) return null;

        const rec       = records[0];
        const tt        = rec.timetableData;
        // slotData may have multiple entries; find the one with this room
        const slotEntry = rec.slotData.find(
            s => s.room && s.room.toLowerCase() === room.toLowerCase()
        );

        if (!slotEntry) return null;

        // session is like "2023-2027" or "2024-2028"
        // batch year = start year of session (first 4 digits)
        const session = tt.session || '';
// Extract start year from session like "2025-2026 (Even)" → 2025
const sessionStartYear = parseInt(session.split('-')[0]) || new Date().getFullYear();

// Extract sem number from rec.sem like "B.Tech-ECE-6" or "6" or "sem6"
const semRaw = (rec.sem || '').toString();
const semMatch = semRaw.match(/\d+/);
const semNum = semMatch ? parseInt(semMatch[0]) : 0;

// sem 1-2 = year 1, 3-4 = year 2, 5-6 = year 3, 7-8 = year 4
const yearOfStudy = semNum > 0 ? Math.ceil(semNum / 2) : 1;

// admission year = current session start year - (yearOfStudy - 1)
const batchYear = String(sessionStartYear - (yearOfStudy - 1));

        // timetable.name is like "BTECH" or "B.TECH", dept is like "CSE"
        // Sanitize: uppercase, remove dots/spaces
        const ttNameUpper = (tt.name || '').toUpperCase();
let degree = 'BTECH'; // safe default
for (const d of ['MTECH', 'PHD', 'BSC', 'MSC', 'MBA', 'MCA', 'BTECH', 'B.TECH', 'M.TECH']) {
    if (ttNameUpper.includes(d.replace('.', ''))) { degree = d.replace('.', ''); break; }
}
        const dept   = (tt.dept  || '').trim().toUpperCase().replace(/\s+/g, '_');

        // batch folder name: BTECH_CSE_2023
        const batch = `${degree}_${dept}_${batchYear}`;

        return {
            batch,
            subject:   slotEntry.subject  || '',
            faculty:   slotEntry.faculty  || '',
            sem:       rec.sem            || '',
            dept,
            degree,
            session,
            batchYear,
            locksemId: rec._id.toString(),
            timetableId: tt._id.toString(),
            timetableName: tt.name,
            day: dayName,
        };
    } catch (err) {
        console.error('[lookupLocksem] error:', err.message);
        return null;
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

// ─── Run Attendance via RTSP ───────────────────────────────────
// 1. Lookup LockSem using room + slot + date to get batch/subject/faculty
// 2. Derive ground truth folder name from timetable session
// 3. Stream SSE from Python ML service
router.post('/run-attendance-rtsp', async (req, res) => {
    const { room, slot, date, rtspUrl, durationSec, frameSkip, batch: manualBatch,
            subject: manualSubject, faculty: manualFaculty, semester: manualSem,
            locksemId: manualLocksemId } = req.body;

    // Step 1: Try to auto-resolve context from LockSem
    let ctx = null;
    if (room && slot && date) {
        ctx = await lookupLocksem(room, slot, date);
        if (ctx) {
            console.log(`[AttendanceRTSP] LockSem matched → batch=${ctx.batch} subject=${ctx.subject} faculty=${ctx.faculty}`);
        } else {
            console.warn(`[AttendanceRTSP] No LockSem match for room=${room} slot=${slot} date=${date} — using manual batch`);
        }
    }

    // Step 2: Build final payload, preferring LockSem data over manual inputs
    const resolvedBatch   = ctx?.batch    || manualBatch || '';
    const resolvedSubject = ctx?.subject  || manualSubject || '';
    const resolvedFaculty = ctx?.faculty  || manualFaculty || '';
    const resolvedSem     = ctx?.sem      || manualSem    || '';
    const resolvedLocksem = ctx?.locksemId|| manualLocksemId || '';

    if (!resolvedBatch) {
        return res.status(400).json({
            error: 'Could not determine batch. Either timetable not found for this room/slot/date, or select batch manually.',
            room, slot, date,
            hint: 'Make sure the timetable is locked (LockSem) and currentSession=true on the timetable.'
        });
    }

    console.log(`[AttendanceRTSP] Running with batch=${resolvedBatch} rtsp=${rtspUrl} duration=${durationSec}s`);

    // Step 3: Pipe to Python with resolved context injected
    await pipeStream('run-attendance-rtsp', {
        ...req.body,
        batch:     resolvedBatch,
        subject:   resolvedSubject,
        faculty:   resolvedFaculty,
        semester:  resolvedSem,
        locksemId: resolvedLocksem,
        // Pass context back so the frontend can display it after 'done' event
        _resolvedCtx: ctx || null,
    }, res);
});

module.exports = router;

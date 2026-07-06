// server/src/modules/attendanceModule/controllers/attendanceSessionController.js
// Manages "live attendance sessions" — periodic checks from the frontend.
// Frontend starts a session → this runs check every N minutes →
// frontend polls GET /reports/:id to see new runs appear.

const axios = require('axios');
const path  = require('path');
const fs    = require('fs');
const AttendanceReport = require('../../../models/attendanceReport');
const { saveAttendanceDailyData } = require('./attendanceDailyDataSaver');
const { saveUnknownFaces } = require('./unknownFaceWriter');
const { saveFrameSnapshots, RAW_DIR: FRAME_SNAPSHOTS_DIR } = require('./frameSnapshotWriter');
const { buildEnrolledEmbeddings } = require('./embeddingSyncHelper');
const { pklPath } = require('./erpEmbeddingSyncHelper');


const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

// ── In-memory session tracking ──────────────────────────────────────────────
// Lost on server restart — acceptable for now.
// Key: reportId string, Value: { timer, checkIndex, config, status }
const activeSessions = new Map();

// ── Session-frame clustering (replaces the old face_cluster.py child-process
// spawn, which required Node and python-ml-service + its venv to be
// co-located on one machine) ─────────────────────────────────────────────────
// Reads this session's saved frame snapshots + the batch's enrolled .pkl off
// Node's own local disk, ships them as bytes to the ML service's
// /cluster-session-frames endpoint, and writes the returned per-student crop
// folders + metadata.json back to outputDir — same on-disk shape
// backupImageUpdater.js already expects from the old script.
// Returns true if clustering ran and outputDir was (re)populated, false if
// there was nothing to cluster (no frames / no db).
async function runSessionClustering(sessionId, outputDir, dbPathStr) {
    const sessionFramesDir = path.join(FRAME_SNAPSHOTS_DIR, sessionId);
    if (!fs.existsSync(sessionFramesDir) || !fs.existsSync(dbPathStr)) {
        console.log(`[SessionClustering] Nothing to cluster for ${sessionId} — missing frames or embeddings db`);
        return false;
    }

    const frameFiles = fs.readdirSync(sessionFramesDir)
        .filter((f) => f.startsWith('frame_') && f.toLowerCase().endsWith('.jpg'));
    if (frameFiles.length === 0) {
        console.log(`[SessionClustering] No frames found in ${sessionFramesDir}`);
        return false;
    }

    const frames = frameFiles.map((f) => fs.readFileSync(path.join(sessionFramesDir, f)).toString('base64'));
    const dbData = fs.readFileSync(dbPathStr).toString('base64');

    const response = await axios.post(`${ML_URL}/cluster-session-frames`, {
        frames,
        db_data: dbData,
        cluster_threshold: 0.45,
        min_samples: 3,
    }, { timeout: 180000 });

    const clusters = response.data?.clusters || [];

    // Clear + recreate outputDir, matching the old script's behavior (each
    // session's clustering run replaces the previous one, not merges with it).
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });

    for (const cluster of clusters) {
        const clusterDir = path.join(outputDir, cluster.clusterId);
        fs.mkdirSync(clusterDir, { recursive: true });
        cluster.crops.forEach((crop, i) => {
            fs.writeFileSync(
                path.join(clusterDir, `image_${String(i + 1).padStart(3, '0')}.jpg`),
                Buffer.from(crop, 'base64'),
            );
        });
        fs.writeFileSync(
            path.join(clusterDir, 'metadata.json'),
            JSON.stringify({
                rollNo: cluster.rollNo,
                confidence: cluster.confidence,
                confidenceScores: cluster.confidenceScores,
                imageCount: cluster.imageCount,
                sourceSession: sessionId,
                type: cluster.type,
                clusterId: cluster.clusterId,
            }, null, 2),
        );
    }

    console.log(`[SessionClustering] ${sessionId}: wrote ${clusters.length} cluster folder(s) to ${outputDir}`);
    return clusters.length > 0;
}

// ── Merge helpers (same logic as attendanceReportController) ─────────────────

function mergeStudentStatus(slotResults) {
    const rollMap = {};
    for (const slot of slotResults) {
        for (const s of slot.students) {
            if (!rollMap[s.rollNo]) rollMap[s.rollNo] = [];
            rollMap[s.rollNo].push(s);
        }
    }

    return Object.entries(rollMap).map(([rollNo, entries]) => {
        const best        = entries.reduce((p, c) => c.avgConfidence > p.avgConfidence ? c : p, entries[0]);
        const highPresent = entries.filter(e => e.status === 'present' && e.confidenceZone !== 'low');
        const anyPresent  = entries.some(e => e.status === 'present');
        const allAbsent   = entries.every(e => e.status === 'absent');
        const anyReview   = entries.some(e => e.status === 'review');

        const finalStatus = highPresent.length > 0 ? 'P'
                          : anyPresent             ? 'R'
                          : anyReview              ? 'R'
                          : allAbsent              ? 'A' : 'A';

        return {
            rollNo,
            status:         best.status,
            avgConfidence:  best.avgConfidence,
            confidenceZone: best.confidenceZone,
            firstSeenSec:   best.firstSeenSec,
            clusterFolder:  best.clusterFolder || null,
            finalStatus,
        };
    });
}

function buildSummary(finalReport) {
    const total   = finalReport.length;
    const present = finalReport.filter(s => s.finalStatus === 'P').length;
    const absent  = finalReport.filter(s => s.finalStatus === 'A').length;
    const review  = finalReport.filter(s => s.finalStatus === 'R').length;
    return {
        totalStudents: total, present, absent, review,
        attendancePct: total > 0 ? Math.round((present / total) * 100) : 0,
        unknownFaceCount: 0 // Will be added outside
    };
}

// ── Run one check against Python sync endpoint ──────────────────────────────

async function runOneCheck(reportId, checkIndex, config) {
    const tag = `[Session ${reportId} check-${checkIndex}]`;
    console.log(`${tag} Starting…`);

    try {
        const res = await axios.post(
            `${ML_URL}/run-attendance-rtsp-sync`,
            {
                rtspUrl:          config.rtspUrl,
                rtspUrl2:         config.rtspUrl2 || '',
                batch:            config.batch,
                room:             config.room,
                slot:             config.slot,
                date:             config.date,
                durationSec:      config.durationSec,
                frameSkip:        config.frameSkip        || 10,
                clusterThreshold: config.clusterThreshold || 0.45,
                minSamples:       config.minSamples       || 2,
                autoThreshold:    config.autoThreshold    || 0.40,
                reviewThreshold:  config.reviewThreshold  || 0.20,
                subject:          config.subject          || '',
                faculty:          config.faculty          || '',
                semester:         config.semester         || '',
                locksemId:        config.locksemId        || '',
                enrolledRollNos:  config.enrolledRollNos  || [],
                enrolledEmbeddings: buildEnrolledEmbeddings(GROUND_TRUTH_DIR, config.batch),
            },
            { timeout: 300000 }   // 5 min timeout
        );

        const mlResult   = res.data;
        const attendance = mlResult.attendance || {};

        // ── Persist raw + annotated frame files (Issue #1544) ──────────────────
        // The ML service is stateless — it never writes to server/ml-data/ itself
        // (it may be running on a separate GPU machine). frame_files carries the
        // base64-encoded bytes for every snapshot taken during this check; we
        // write them here, plus merge each snapshot's face count into the
        // _faces.json sidecar the cleanup scheduler reads.
        try {
            saveFrameSnapshots(mlResult.frame_files || []);
        } catch (snapErr) {
            console.warn('[Session] Could not save frame snapshots:', snapErr.message);
        }

        // Build per-student list
        // Normalise status: only allow values in the Mongoose enum
        const VALID_STATUSES = new Set(['present', 'absent', 'review', 'not_enrolled']);
        const students = Object.entries(attendance).map(([rollNo, data]) => {
            const rawStatus = data.status || 'absent';
            const status    = VALID_STATUSES.has(rawStatus) ? rawStatus : 'absent';
            return {
                rollNo,
                status,
                avgConfidence:  data.avg_confidence  || 0,
                confidenceZone: data.confidence_zone || 'low',
                firstSeenSec:   data.first_seen_sec  || null,
                clusterFolder:  null,
                finalStatus:    status === 'present' ? 'P'
                              : status === 'review'  ? 'R' : 'A',
            };
        });
        const slotResult = {
            slot:          `check-${checkIndex}`,
            videoLink:     '',
            frameSnapshot: mlResult.snapshot_folder || '',
            processedAt:   new Date(),
            students,
            summary: {
                present:           mlResult.summary?.present          || 0,
                absent:            mlResult.summary?.absent           || 0,
                review:            mlResult.summary?.review           || 0,
                total:             students.length,
                processingTimeSec: mlResult.summary?.processing_time  || 0,
            },
        };

        // Atomically push into DB and recompute
        const report = await AttendanceReport.findById(reportId);
        if (!report) {
            console.error(`${tag} Report not found in DB — stopping session`);
            stopSession(reportId);
            return;
        }

        report.slotResults.push(slotResult);
        report.finalReport = mergeStudentStatus(report.slotResults);
        
        const currentUnknownCount = report.summary && report.summary.unknownFaceCount ? report.summary.unknownFaceCount : 0;
        const newUnknownCount = (mlResult.unmatched_clusters && mlResult.unmatched_clusters.length) ? mlResult.unmatched_clusters.length : 0;
        
        report.summary     = buildSummary(report.finalReport);
        report.summary.unknownFaceCount = currentUnknownCount; // saveUnknownFaces handles incrementing
        
        await report.save();

        // Fire and forget unknown face processing
        if (newUnknownCount > 0) {
            saveUnknownFaces(mlResult.unmatched_clusters, config, reportId);
        }

        saveAttendanceDailyData(
            { batch: config.batch, date: config.date, slot: config.slot, room: config.room,
              subject: config.subject, faculty: config.faculty, semester: config.semester,
              locksemId: config.locksemId },
            mlResult,
            checkIndex
        );

        console.log(`${tag} ✅ Saved — P:${slotResult.summary.present} A:${slotResult.summary.absent} R:${slotResult.summary.review} (${students.length} students, ${slotResult.summary.processingTimeSec}s)`);

        // Run face_cluster.py automation
        const room_clean = (config.room || 'ROOM').toUpperCase().replace(/[^\w]/g, '_');
        const slot_clean = (config.slot || 'SLOT').toUpperCase().replace(/[^\w]/g, '_');
        const date_clean = (config.date || '').replace(/-/g, '') || new Date().toISOString().slice(0,10).replace(/-/g, '');
        const sessionId = `${room_clean}_${slot_clean}_${date_clean}`;

        // Dynamically extract department from batch (e.g., BTECH_ELECTRONICS_AND_COMMUNICATION_ENGINEERING_2023)
        const batchParts = (config.batch || '').split('_');
        let extractedDepartment = config.department || 'UNKNOWN';
        if (!config.department || config.department === 'UNKNOWN') {
            if (batchParts.length >= 3) {
                extractedDepartment = batchParts.slice(1, -1).join('_');
            } else if (batchParts.length > 1) {
                extractedDepartment = batchParts[1];
            }
        }

        const outputDir = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'faces', extractedDepartment, config.date || 'UNKNOWN', config.semester || 'UNKNOWN', config.slot || 'UNKNOWN');
        const dbPathStr = pklPath(config.batch, extractedDepartment);

        console.log(`${tag} Requesting session clustering for session_id=${sessionId}`);
        runSessionClustering(sessionId, outputDir, dbPathStr)
            .then((didCluster) => {
                if (!didCluster) return;
                // ── Issue #1512 — active learning: update backup images ──────
                // Cluster crops + confidence scores were just written to
                // outputDir. Reuse that directly — only backup_files gets
                // touched, never embedding_files, and at most one new backup
                // per student per day (see backupImageUpdater.js).
                const { updateBackupsFromSession } = require('./backupImageUpdater');
                return updateBackupsFromSession(outputDir, config.date, extractedDepartment)
                    .catch(err => console.error(`[BackupUpdate] Failed: ${err.message}`));
            })
            .catch(err => console.error(`${tag} Session clustering failed: ${err.message}`));

    } catch (err) {
        console.error(`${tag} ❌ Failed: ${err.message}`);
        // Don't stop the session — next check may succeed
    }
}

// ── Start a multi-run session ───────────────────────────────────────────────

async function startSession(config) {
    const {
        room, slot, date, rtspUrl, rtspUrl2,
        durationSec, checkIntervalMin,
        batch, department, subject, faculty, semester, locksemId,
        enrolledRollNos,
    } = config;

    if (!batch || !rtspUrl || !room || !slot || !date) {
        throw new Error('batch, rtspUrl, room, slot, and date are required');
    }

    const intervalMin = checkIntervalMin || 5;

    // 1. Upsert: reuse existing report for this batch+date+slot if it exists
let report = await AttendanceReport.findOne({ batch, date, timeSlot: slot });
if (report) {
    if (report.status === 'finalized') {
        throw new Error('A finalized report already exists for this slot. Cannot start a new session.');
    }
    // Reuse it — flip back to live and update metadata
    report.status = 'live';
    if (department) report.department = department;
    if (subject)    report.subject    = subject;
    if (faculty)    report.faculty    = faculty;
    if (semester)   report.semester   = semester;
    if (locksemId)  report.locksemId  = locksemId;
    await report.save();
} else {
    report = new AttendanceReport({
        batch,
        department: department || '',
        semester:   semester   || '',
        subject:    subject    || '',
        faculty:    faculty    || '',
        room,
        date,
        timeSlot:   slot,
        locksemId:  locksemId || null,
        slotResults: [],
        status:     'live',
    });
    await report.save();
}
const reportId = report._id.toString();

    console.log(`[Session] Started — reportId=${reportId} batch=${batch} room=${room} slot=${slot} interval=${intervalMin}min duration=${durationSec}s`);

    // 2. Store session config
    const sessionConfig = {
        rtspUrl, rtspUrl2: rtspUrl2 || '',
        batch, room, slot, date,
        durationSec:      durationSec      || 60,
        subject, faculty, semester, locksemId,
        enrolledRollNos:  enrolledRollNos  || [],
        autoThreshold:    config.autoThreshold    || 0.40,
        reviewThreshold:  config.reviewThreshold  || 0.20,
        clusterThreshold: config.clusterThreshold || 0.45,
        minSamples:       config.minSamples       || 2,
        frameSkip:        config.frameSkip        || 10,
    };

    // 3. Run first check immediately (don't await — let it run in background
    //    so the HTTP response returns fast)
    let checkIndex = 1;

    const session = {
        timer: null,
        checkIndex,
        config: sessionConfig,
        status: 'running',
    };
    activeSessions.set(reportId, session);

    // Fire first check (no await — runs async)
    runOneCheck(reportId, checkIndex, sessionConfig).catch(err => {
        console.error(`[Session ${reportId}] First check error: ${err.message}`);
    });

    // 4. Schedule subsequent checks
    const timer = setInterval(async () => {
        const sess = activeSessions.get(reportId);
        if (!sess || sess.status !== 'running') {
            clearInterval(timer);
            return;
        }
        sess.checkIndex++;
        await runOneCheck(reportId, sess.checkIndex, sessionConfig);
    }, intervalMin * 60 * 1000);

    session.timer = timer;

    return { reportId, status: 'started', checkIntervalMin: intervalMin };
}

// ── Stop a session ──────────────────────────────────────────────────────────

async function stopSession(reportId) {
    const session = activeSessions.get(reportId);
    if (session) {
        if (session.timer) clearInterval(session.timer);
        session.status = 'stopped';
        activeSessions.delete(reportId);
        console.log(`[Session] Stopped — reportId=${reportId} after ${session.checkIndex} checks`);
    }

    // Set report status to 'draft' so it can be reviewed/finalized
    try {
        await AttendanceReport.findByIdAndUpdate(reportId, { status: 'draft' });
    } catch (err) {
        console.error(`[Session] Failed to update report status: ${err.message}`);
    }

    return { status: 'stopped', reportId };
}

// ── Get session status ──────────────────────────────────────────────────────

function getSessionStatus(reportId) {
    const session = activeSessions.get(reportId);
    if (!session) return { active: false, reportId };
    return {
        active:     true,
        reportId,
        checkIndex: session.checkIndex,
        status:     session.status,
    };
}

// ── List all active sessions ────────────────────────────────────────────────

function listActiveSessions() {
    const sessions = [];
    for (const [reportId, session] of activeSessions) {
        sessions.push({
            reportId,
            checkIndex: session.checkIndex,
            status:     session.status,
            batch:      session.config.batch,
            room:       session.config.room,
            slot:       session.config.slot,
        });
    }
    return sessions;
}

module.exports = {
    startSession,
    stopSession,
    getSessionStatus,
    listActiveSessions,
};
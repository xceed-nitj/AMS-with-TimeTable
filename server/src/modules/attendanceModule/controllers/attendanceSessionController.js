// server/src/modules/attendanceModule/controllers/attendanceSessionController.js
// Manages "live attendance sessions" — periodic checks from the frontend.
// Frontend starts a session → this runs check every N minutes →
// frontend polls GET /reports/:id to see new runs appear.

const axios = require('axios');
const AttendanceReport = require('../../../models/attendanceReport');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

// ── In-memory session tracking ──────────────────────────────────────────────
// Lost on server restart — acceptable for now.
// Key: reportId string, Value: { timer, checkIndex, config, status }
const activeSessions = new Map();

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
            },
            { timeout: 300000 }   // 5 min timeout
        );

        const mlResult   = res.data;
        const attendance = mlResult.attendance || {};

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
            frameSnapshot: (mlResult.frame_snapshots || []).map(s => String(s.path || '')).join(', '),
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
        report.summary     = buildSummary(report.finalReport);
        await report.save();

        console.log(`${tag} ✅ Saved — P:${slotResult.summary.present} A:${slotResult.summary.absent} R:${slotResult.summary.review} (${students.length} students, ${slotResult.summary.processingTimeSec}s)`);

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
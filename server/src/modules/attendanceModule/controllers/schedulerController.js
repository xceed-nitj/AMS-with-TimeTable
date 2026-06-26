// server/src/modules/attendanceModule/controllers/schedulerController.js
//
// Manual "Run All Rooms" trigger — mirrors autoAttendanceScheduler.js's per-room
// flow but runs every enabled room for a chosen slot in parallel (Promise.allSettled)
// and returns a full per-room status array instead of running silently via cron.

const path = require('path');
const axios = require('axios');

const AcquisitionControl = require('../../../models/acquisitionControl');
const LockSem = require('../../../models/locksem');
const TimeTable = require('../../../models/timetable');
const Camera = require('../../../models/attendanceModule/camera');
const Subject = require('../../../models/subject');
const AttendanceReport = require('../../../models/attendanceReport');
const { buildEnrolledEmbeddings } = require('./embeddingSyncHelper');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const EMBEDDINGS_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings');
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function dayOfWeek(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function safeSubject(raw) {
  return (raw || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/, '');
}

function currentSession() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 8 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

// ── Step: resolve slot context for a room (LockSem primary, ExtraClass fallback) ──
async function resolveRoomContext(room, slot, date, config) {
  const day = dayOfWeek(date);

  // Primary: LockSem
  const records = await LockSem.aggregate([
    {
      $match: {
        slot: { $regex: new RegExp(`^${slot}$`, 'i') },
        day: { $regex: new RegExp(`^${day}$`, 'i') },
        'slotData.room': { $regex: new RegExp(`^${room}$`, 'i') },
      },
    },
    {
      $lookup: {
        from: 'timetables',
        localField: 'timetable',
        foreignField: '_id',
        as: 'tt',
      },
    },
    { $unwind: { path: '$tt', preserveNullAndEmptyArrays: false } },
    { $match: { 'tt.currentSession': true } },
    { $limit: 1 },
  ]);

  if (records.length) {
    const rec = records[0];
    const tt = rec.tt;
    const slotEntry = rec.slotData.find(
      (s) => s.room && s.room.toLowerCase() === room.toLowerCase(),
    );
    if (slotEntry) {
      const session = tt.session || currentSession();
      const sessionStartYear = parseInt(session.split('-')[0]) || new Date().getFullYear();
      const semNum = parseInt((rec.sem || '').match(/\d+/)?.[0] || '0');
      const yearOfStudy = semNum > 0 ? Math.ceil(semNum / 2) : 1;
      const batchYear = String(sessionStartYear - (yearOfStudy - 1));
      const ttName = (tt.name || '').toUpperCase();
      let degree = 'BTECH';
      for (const d of ['MTECH', 'PHD', 'BSC', 'MSC', 'MBA', 'MCA', 'BTECH']) {
        if (ttName.includes(d)) { degree = d; break; }
      }
      const dept = (tt.dept || '').trim().toUpperCase().replace(/\s+/g, '_');
      const batch = `${degree}_${dept}_${batchYear}`;

      return {
        source: 'locksem',
        batch,
        subject: slotEntry.subject || '',
        faculty: slotEntry.faculty || '',
        sem: rec.sem || '',
        dept,
        session,
        locksemId: rec._id.toString(),
      };
    }
  }

  // Fallback: ExtraClass
  const extra = (config.extraClasses || []).find(
    (ec) => ec.active
      && ec.room?.toLowerCase().trim() === room.toLowerCase().trim()
      && ec.periodKey === slot
      && ec.date === date,
  );
  if (extra) {
    return {
      source: 'extraClass',
      batch: extra.batch,
      subject: extra.subject || '',
      faculty: extra.faculty || '',
      sem: extra.semester || '',
      dept: '',
      session: currentSession(),
      locksemId: null,
    };
  }

  return null;
}

// ── Step: resolve cameras for a room ──────────────────────────────────────
async function resolveCameras(room, roomOverride) {
  if (roomOverride?.rtspUrl1) {
    return { cam1: roomOverride.rtspUrl1, cam2: roomOverride.rtspUrl2 || '', source: 'override' };
  }
  const cams = await Camera.find({ roomId: room.toUpperCase(), isActive: true }).lean();
  const front = cams.find((c) => c.position === 'front-left');
  const back = cams.find((c) => c.position === 'front-right');
  return {
    cam1: front?.streamUrl || '',
    cam2: back?.streamUrl || '',
    source: 'cameraDb',
    count: cams.length,
  };
}

// ── Step: resolve embedding PKL for a subject — returns bytes too (stateless) ──
function resolveEmbeddingPkl(dept, subject, session) {
  const fs = require('fs');
  const deptSafe = safeSubject(dept || 'UNKNOWN');
  const sessionToUse = session || currentSession();
  const folder = path.join(EMBEDDINGS_DIR, sessionToUse, deptSafe);
  if (!fs.existsSync(folder)) return null;

  const pklFiles = fs.readdirSync(folder).filter((f) => f.endsWith('.pkl'));
  if (!pklFiles.length) return null;

  const subjectTokens = safeSubject(subject).toLowerCase().split('_').filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const f of pklFiles) {
    const fileTokens = f.replace(/\.pkl$/i, '').toLowerCase().split('_');
    const overlap = subjectTokens.filter((t) => fileTokens.includes(t)).length;
    if (overlap > bestScore) { bestScore = overlap; best = f; }
  }
  if (!best) return null;

  const fullPath = path.join(folder, best);
  let pklData;
  try {
    // Node owns ml-data/ — reads the bytes itself and ships them over the
    // wire. Python is stateless: it never touches this path, since in a
    // deployed setup Node and the ML service may not share a filesystem.
    pklData = fs.readFileSync(fullPath).toString('base64');
  } catch (err) {
    console.error('[Scheduler] Failed to read PKL bytes:', err.message);
    return null;
  }

  return { filename: best, pklData };
}

// ── Step: lookup Subject doc for ERP metadata ─────────────────────────────
async function lookupSubjectMeta(subject, sem, dept) {
  if (!subject) return null;
  const subj = await Subject.findOne({
    subjectFullName: { $regex: subject.trim(), $options: 'i' },
    sem,
  }).lean();
  if (!subj) return null;
  return {
    subName: subj.subName || '',
    subCode: subj.subCode || '',
    subjectFullName: subj.subjectFullName || '',
    credits: subj.credits ?? null,
  };
}

// ── Run one room end-to-end ────────────────────────────────────────────────
async function runRoom({ room, roomOverride, slot, date, config }) {
  const log = [];
  const push = (msg) => log.push({ t: Date.now(), msg });

  // 1. Working day check
  if (!config.active) {
    return { room, status: 'skipped', reason: 'Acquisition Off (global)', log };
  }
  if ((config.stoppedDays || []).includes(date)) {
    return { room, status: 'skipped', reason: 'Stopped Day', log };
  }
  if (roomOverride && roomOverride.enabled === false) {
    return { room, status: 'skipped', reason: 'Room disabled', log };
  }

  push('Working day check passed');

  // 2. Slot data
  const ctx = await resolveRoomContext(room, slot, date, config);
  if (!ctx) {
    return { room, status: 'skipped', reason: 'No Class Scheduled', log };
  }
  push(`Class resolved: ${ctx.batch} — ${ctx.subject} (${ctx.source})`);

  // 3. Cameras
  const cameras = await resolveCameras(room, roomOverride);
  if (!cameras.cam1) {
    push('⚠ No active camera found — proceeding anyway (will likely fail at ML step)');
  } else {
    push(`Camera resolved (${cameras.source}): cam1=${!!cameras.cam1} cam2=${!!cameras.cam2}`);
  }

  // 4. Embedding check
  const pkl = resolveEmbeddingPkl(ctx.dept, ctx.subject, ctx.session);
  if (!pkl) {
    return {
      room, status: 'skipped', reason: 'No Embeddings for Subject',
      ctx, cameras, log,
    };
  }
  push(`Embeddings found: ${pkl.filename}`);

  // 5. Run settings
  const periodCfg = (config.periods || []).find((p) => p.periodKey === slot) || {};
  const numRuns = periodCfg.numRuns ?? config.globalNumRuns ?? 1;
  const runDurationSec = periodCfg.runDurationSec ?? config.globalRunDurationSec ?? 120;
  const presentLogic = periodCfg.presentLogic ?? config.globalPresentLogic ?? 'majority';

// 6. Call Python ML service (sync, single run — see "numRuns behavior" open question)
  push(`Starting ML run (durationSec=${runDurationSec}, presentLogic=${presentLogic})`);
  let mlResult;
  try {
    // Stateless: send the PKL bytes themselves, not a path. Python and Node
    // may be on different machines in a deployed setup, so no shared
    // filesystem can be assumed — same contract as embeddingSyncHelper.js
    // and the ERP embedding endpoints in ground_truth_routes.py.
    const res = await axios.post(
      `${ML_URL}/run-attendance-rtsp-sync`,
      {
        rtspUrl: cameras.cam1,
        rtspUrl2: cameras.cam2 || '',
        batch: ctx.batch,
        room,
        slot,
        date,
        durationSec: runDurationSec,
        subject: ctx.subject,
        faculty: ctx.faculty,
        semester: ctx.sem,
        locksemId: ctx.locksemId,
        embeddingsPklData: pkl.pklData,   // base64 .pkl bytes — replaces enrolledEmbeddings
      },
      { timeout: 300000 },
    );
    mlResult = res.data;
  } catch (err) {
    return {
      room, status: 'error', reason: err.response?.data?.detail || err.message,
      ctx, cameras, pkl, log,
    };
  }
  push(`ML run complete: P:${mlResult.summary?.present} A:${mlResult.summary?.absent} R:${mlResult.summary?.review}`);

  // 7. Subject metadata for ERP
  const subjectMeta = await lookupSubjectMeta(ctx.subject, ctx.sem, ctx.dept);

  // 8. Save report
  const attendance = mlResult.attendance || {};
  const students = Object.entries(attendance).map(([rollNo, data]) => ({
    rollNo,
    status: data.status || 'absent',
    avgConfidence: data.avg_confidence || 0,
    confidenceZone: data.confidence_zone || 'low',
    firstSeenSec: data.first_seen_sec || null,
    finalStatus: data.status === 'present' ? 'P' : data.status === 'review' ? 'R' : 'A',
  }));

  const slotResult = {
    slot,
    videoLink: '',
    processedAt: new Date(),
    students,
    summary: {
      present: mlResult.summary?.present || 0,
      absent: mlResult.summary?.absent || 0,
      review: mlResult.summary?.review || 0,
      total: students.length,
      processingTimeSec: mlResult.summary?.processing_time || 0,
    },
  };

  let report = await AttendanceReport.findOne({ batch: ctx.batch, date, timeSlot: slot });
  if (report) {
    if (report.status === 'finalized') {
      return { room, status: 'error', reason: 'Report already finalized', ctx, log };
    }
    report.slotResults.push(slotResult);
  } else {
    report = new AttendanceReport({
      batch: ctx.batch,
      department: ctx.dept,
      semester: ctx.sem,
      subject: ctx.subject,
      faculty: ctx.faculty,
      room,
      date,
      timeSlot: slot,
      locksemId: ctx.locksemId,
      subjectMeta: subjectMeta || undefined,
      slotResults: [slotResult],
      status: 'draft',
    });
  }
  if (subjectMeta) report.subjectMeta = subjectMeta;
  report.finalReport = students.map((s) => ({ ...s }));
  report.summary = {
    totalStudents: students.length,
    present: students.filter((s) => s.finalStatus === 'P').length,
    absent: students.filter((s) => s.finalStatus === 'A').length,
    review: students.filter((s) => s.finalStatus === 'R').length,
    attendancePct: students.length
      ? Math.round((students.filter((s) => s.finalStatus === 'P').length / students.length) * 100)
      : 0,
  };
  await report.save();
  push('Report saved');

  return {
    room,
    status: 'done',
    ctx,
    cameras,
    pkl,
    subjectMeta,
    reportId: report._id,
    summary: report.summary,
    log,
  };
}

// ── POST /attendancemodule/scheduler/run-all ──────────────────────────────
// Body: { slot, date? }
exports.runAll = async (req, res) => {
  try {
    const { slot } = req.body;
    const date = req.body.date || todayStr();
    if (!slot) return res.status(400).json({ error: 'slot is required' });

    const config = await AcquisitionControl.findOne({ profileName: 'default' }).lean();
    if (!config) return res.status(404).json({ error: 'AcquisitionControl config not found' });

    const enabledRooms = (config.includedRooms || []).filter((r) => r.enabled !== false);
    if (!enabledRooms.length) {
      return res.status(400).json({ error: 'No enabled rooms in AcquisitionControl. Add rooms first.' });
    }

    const results = await Promise.allSettled(
      enabledRooms.map((roomOverride) =>
        runRoom({ room: roomOverride.room, roomOverride, slot, date, config })),
    );

    const rooms = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { room: enabledRooms[i].room, status: 'error', reason: r.reason?.message || 'Unknown error' });

    const summary = {
      total: rooms.length,
      done: rooms.filter((r) => r.status === 'done').length,
      skipped: rooms.filter((r) => r.status === 'skipped').length,
      error: rooms.filter((r) => r.status === 'error').length,
    };

    res.json({ slot, date, summary, rooms });
  } catch (err) {
    console.error('[SchedulerController] runAll error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /attendancemodule/scheduler/preview?slot=period1&date=2026-06-22 ──
// "Would-run" dry preview — does steps 1-4 only, no ML call, no save.
// Used when acquisition is globally off, or just to check before running.
exports.preview = async (req, res) => {
  try {
    const { slot } = req.query;
    const date = req.query.date || todayStr();
    if (!slot) return res.status(400).json({ error: 'slot is required' });

    const config = await AcquisitionControl.findOne({ profileName: 'default' }).lean();
    if (!config) return res.status(404).json({ error: 'AcquisitionControl config not found' });

    const enabledRooms = (config.includedRooms || []).filter((r) => r.enabled !== false);

    const rooms = await Promise.all(
      enabledRooms.map(async (roomOverride) => {
        const room = roomOverride.room;
        if ((config.stoppedDays || []).includes(date)) {
          return { room, status: 'skipped', reason: 'Stopped Day' };
        }
        const ctx = await resolveRoomContext(room, slot, date, config);
        if (!ctx) return { room, status: 'skipped', reason: 'No Class Scheduled' };
        const cameras = await resolveCameras(room, roomOverride);
        const pkl = resolveEmbeddingPkl(ctx.dept, ctx.subject, ctx.session);
        return {
          room,
          status: pkl ? 'would-run' : 'skipped',
          reason: pkl ? null : 'No Embeddings for Subject',
          ctx,
          cameras: { hasCam1: !!cameras.cam1, hasCam2: !!cameras.cam2 },
          pkl: pkl ? pkl.filename : null,
        };
      }),
    );

    res.json({ slot, date, acquisitionActive: config.active, rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// autoAttendanceScheduler.js
// Automated attendance: runs every checkIntervalMin within each timetable slot.
// Two cameras per room — Python handles the 30s switch.
// Saves frame snapshot + prints face count per check.
// Notifies unmatched faces separately.

const axios = require("axios");
const cron = require("node-cron");
const path = require("path");
const LockSem = require("../../../models/locksem");
const TimeTable = require("../../../models/timetable");
const AttendanceReport = require("../../../models/attendanceReport");
const { saveAttendanceDailyData } = require("./attendanceDailyDataSaver");
const { saveUnknownFaces } = require("./unknownFaceWriter");
const { saveFrameSnapshots } = require("./frameSnapshotWriter");
const { buildEnrolledEmbeddings } = require("./embeddingSyncHelper");
const alertNotifier = require("./alertNotifier");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8500";
const GROUND_TRUTH_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "ml-data",
  "ground_truth",
);

// ── Slot schedule — start/end in minutes from midnight ──────────────────────
const SLOT_SCHEDULE = {
  period1: { startMin: 8 * 60 + 30, endMin: 9 * 60 + 30 },
  period2: { startMin: 9 * 60 + 30, endMin: 10 * 60 + 30 },
  period3: { startMin: 10 * 60 + 30, endMin: 11 * 60 + 30 },
  period4: { startMin: 11 * 60 + 30, endMin: 12 * 60 + 30 },
  period5: { startMin: 13 * 60 + 30, endMin: 14 * 60 + 30 },
  period6: { startMin: 14 * 60 + 30, endMin: 15 * 60 + 30 },
  period7: { startMin: 15 * 60 + 30, endMin: 16 * 60 + 30 },
  period8: { startMin: 16 * 60 + 30, endMin: 17 * 60 + 30 },
};

// ── Room → camera config  (fill this from env or DB) ────────────────────────
// Each room has cam1 (required) and cam2 (optional, second camera)
const ROOM_CAMERA_MAP = {
  // 'LT-103': {
  //     cam1: process.env.RTSP_LT103_CAM1 || 'rtsp://admin:...',
  //     cam2: process.env.RTSP_LT103_CAM2 || '',
  // },
};

// ── Default config — checkIntervalMin is NOT hardcoded, loaded per-run ───────
const DEFAULT_CONFIG = {
  checkIntervalMin: 5, // overridden per-room from frontend/env
  durationSec: 60,
  frameSkip: 10,
  clusterThreshold: 0.45,
  minSamples: 3,
  autoThreshold: 0.6,
  reviewThreshold: 0.4,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function nowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

async function resolveContext(room, slot) {
  try {
    let records = await LockSem.aggregate([
      {
        $match: {
          slot: { $regex: new RegExp(`^${slot}$`, "i") },
          "slotData.room": { $regex: new RegExp(`^${room}$`, "i") },
        },
      },
      {
        $lookup: {
          from: "timetables",
          localField: "timetable",
          foreignField: "_id",
          as: "tt",
        },
      },
      { $unwind: { path: "$tt", preserveNullAndEmptyArrays: false } },
      { $match: { "tt.currentSession": true } },
      { $limit: 1 },
    ]);

    if (!records.length) {
      records = await LockSem.aggregate([
        {
          $match: {
            slot,
            "slotData.room": { $regex: new RegExp(`^${room}$`, "i") },
          },
        },
        {
          $lookup: {
            from: "timetables",
            localField: "timetable",
            foreignField: "_id",
            as: "tt",
          },
        },
        { $unwind: { path: "$tt", preserveNullAndEmptyArrays: false } },
        { $limit: 1 },
      ]);
    }

    if (!records.length) return null;

    const rec = records[0];
    const tt = rec.tt;
    const slotEntry = rec.slotData.find(
      (s) => s.room && s.room.toLowerCase() === room.toLowerCase(),
    );
    if (!slotEntry) return null;

    const session = tt.session || "";
    const sessionStartYear =
      parseInt(session.split("-")[0]) || new Date().getFullYear();
    const semNum = parseInt((rec.sem || "").match(/\d+/)?.[0] || "0");
    const yearOfStudy = semNum > 0 ? Math.ceil(semNum / 2) : 1;
    const batchYear = String(sessionStartYear - (yearOfStudy - 1));
    const ttName = (tt.name || "").toUpperCase();
    let degree = "BTECH";
    for (const d of ["MTECH", "PHD", "BSC", "MSC", "MBA", "MCA", "BTECH"]) {
      if (ttName.includes(d)) {
        degree = d;
        break;
      }
    }
    const dept = (tt.dept || "").trim().toUpperCase().replace(/\s+/g, "_");
    const batch = `${degree}_${dept}_${batchYear}`;

    return {
      batch,
      subject: slotEntry.subject || "",
      faculty: slotEntry.faculty || "",
      sem: rec.sem || "",
      dept,
      locksemId: rec._id.toString(),
    };
  } catch (err) {
    console.error("[AutoScheduler] resolveContext error:", err.message);
    return null;
  }
}

// ── Merge + save sub-result to DB ────────────────────────────────────────────
function mergeStudentStatus(slotResults) {
  const rollMap = {};
  for (const sr of slotResults) {
    for (const s of sr.students) {
      if (!rollMap[s.rollNo]) rollMap[s.rollNo] = [];
      rollMap[s.rollNo].push(s);
    }
  }
  return Object.entries(rollMap).map(([rollNo, entries]) => {
    const best = entries.reduce(
      (p, c) => (c.avgConfidence > p.avgConfidence ? c : p),
      entries[0],
    );
    const highPresent = entries.filter(
      (e) => e.status === "present" && e.confidenceZone !== "low",
    );
    const anyPresent = entries.some((e) => e.status === "present");
    const allAbsent = entries.every((e) => e.status === "absent");
    const anyReview = entries.some((e) => e.status === "review");
    const finalStatus =
      highPresent.length > 0
        ? "P"
        : anyPresent
          ? "R"
          : anyReview
            ? "R"
            : allAbsent
              ? "A"
              : "A";
    return { rollNo, ...best, finalStatus };
  });
}

function buildSummary(finalReport) {
  const total = finalReport.length;
  const present = finalReport.filter((s) => s.finalStatus === "P").length;
  const absent = finalReport.filter((s) => s.finalStatus === "A").length;
  const review = finalReport.filter((s) => s.finalStatus === "R").length;
  return {
    totalStudents: total,
    present,
    absent,
    review,
    attendancePct: total > 0 ? Math.round((present / total) * 100) : 0,
    unknownFaceCount: 0,
  };
}

async function saveCheckResult({
  ctx,
  date,
  slot,
  checkIndex,
  mlResult,
  room,
}) {
  // ML service is stateless — persist the base64 raw/annotated frames it
  // shipped back in frame_files (see frameSnapshotWriter.js).
  try {
    saveFrameSnapshots(mlResult.frame_files || []);
  } catch (snapErr) {
    console.warn(
      "[AutoScheduler] Could not save frame snapshots:",
      snapErr.message,
    );
  }

  const attendance = mlResult.attendance || {};
  const students = Object.entries(attendance).map(([rollNo, data]) => ({
    rollNo,
    status: data.status || "absent",
    avgConfidence: data.avg_confidence || 0,
    confidenceZone: data.confidence_zone || "low",
    firstSeenSec: data.first_seen_sec || null,
    clusterFolder: null,
    finalStatus:
      data.status === "present" ? "P" : data.status === "review" ? "R" : "A",
  }));

  const slotResult = {
    slot: `${slot}-check${checkIndex}`,
    videoLink: "",
    frameSnapshot: mlResult.snapshot_folder || "",
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

  let report = await AttendanceReport.findOne({
    batch: ctx.batch,
    date,
    timeSlot: slot,
  });
  if (report) {
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
      locksemId: ctx.locksemId || null,
      slotResults: [slotResult],
      status: "draft",
    });
  }

  report.finalReport = mergeStudentStatus(report.slotResults);
  // Alert on low-confidence detections
  for (const s of report.finalReport) {
    if (s.confidenceZone === "low" || (s.avgConfidence || 0) < 0.6) {
      alertNotifier
        .notifyLowConfidence({
          batch: ctx.batch,
          rollNo: s.rollNo,
          avgConfidence: s.avgConfidence || 0,
          dept: ctx.dept,
        })
        .catch((err) =>
          console.error("[AutoScheduler] alert failed:", err.message),
        );
    }
  }

  // Alert on duplicate attendance
  const presentRolls = report.finalReport
    .filter((s) => s.finalStatus === "P")
    .map((s) => s.rollNo);

  if (presentRolls.length > 0) {
    const otherReports = await AttendanceReport.find({
      date,
      timeSlot: slot,
      batch: { $ne: ctx.batch },
      "finalReport.rollNo": { $in: presentRolls },
      "finalReport.finalStatus": "P",
    });

    for (const rollNo of presentRolls) {
      const dupReports = otherReports.filter((r) =>
        r.finalReport.some((s) => s.rollNo === rollNo && s.finalStatus === "P"),
      );
      if (dupReports.length > 0) {
        const sessions = [
          { batch: ctx.batch, timeSlot: slot, room },
          ...dupReports.map((r) => ({
            batch: r.batch,
            timeSlot: r.timeSlot,
            room: r.room,
          })),
        ];
        try {
          await alertNotifier.notifyDuplicateAttendance({
            rollNo,
            date,
            sessions,
          });
        } catch (err) {
          console.error("[AutoScheduler] dup alert failed:", err.message);
        }
      }
    }
  }

  const currentUnknownCount =
    report.summary && report.summary.unknownFaceCount
      ? report.summary.unknownFaceCount
      : 0;

  report.summary = buildSummary(report.finalReport);
  report.summary.unknownFaceCount = currentUnknownCount; // saveUnknownFaces handles incrementing

  await report.save();

  saveAttendanceDailyData(
    {
      batch: ctx.batch,
      date,
      slot,
      room,
      subject: ctx.subject,
      faculty: ctx.faculty,
      semester: ctx.sem,
      locksemId: ctx.locksemId,
    },
    mlResult,
    checkIndex,
  );

  // ── Notify unmatched faces ────────────────────────────────────────────
  const unmatched = mlResult.unmatched_clusters || [];
  if (unmatched.length > 0) {
    console.warn(
      `[AutoScheduler] ⚠️  UNMATCHED FACES in check ${checkIndex} for ${ctx.batch} ${slot}:`,
    );
    for (const u of unmatched) {
      console.warn(
        `[AutoScheduler]    cluster_${u.cluster_id} — ${u.detections} detections, best_score=${u.best_score}, first_seen=${u.first_seen}s`,
      );
    }

    // Fire and forget unknown face saving
    saveUnknownFaces(
      unmatched,
      {
        batch: ctx.batch,
        date,
        slot,
        room,
        subject: ctx.subject,
        faculty: ctx.faculty,
        semester: ctx.sem,
        rtspUrl: cameras.cam1, // default for metadata
      },
      report._id.toString(),
    );
  }

  console.log(
    `[AutoScheduler] ✅ Check ${checkIndex} saved — ${ctx.batch} ${slot} — P:${slotResult.summary.present} A:${slotResult.summary.absent} R:${slotResult.summary.review} Unmatched:${unmatched.length}`,
  );
  return report;
}

// ── Run one check (one sync call to Python) ───────────────────────────────────
async function runOneCheck({
  room,
  slot,
  date,
  ctx,
  cameras,
  config,
  checkIndex,
}) {
  try {
    const res = await axios.post(
      `${ML_URL}/run-attendance-rtsp-sync`,
      {
        rtspUrl: cameras.cam1,
        rtspUrl2: cameras.cam2 || "",
        batch: ctx.batch,
        room,
        slot,
        date,
        durationSec: config.durationSec,
        checkIntervalMin: config.checkIntervalMin,
        frameSkip: config.frameSkip,
        clusterThreshold: config.clusterThreshold,
        minSamples: config.minSamples,
        autoThreshold: config.autoThreshold,
        reviewThreshold: config.reviewThreshold,
        subject: ctx.subject,
        faculty: ctx.faculty,
        semester: ctx.sem,
        locksemId: ctx.locksemId,
        enrolledEmbeddings: buildEnrolledEmbeddings(
          GROUND_TRUTH_DIR,
          ctx.batch,
        ),
      },
      { timeout: 300000 },
    );

    await saveCheckResult({
      ctx,
      date,
      slot,
      checkIndex,
      mlResult: res.data,
      room,
    });
  } catch (err) {
    console.error(
      `[AutoScheduler] Check ${checkIndex} failed for ${slot} room ${room}: ${err.message}`,
    );
  }
}

// ── Run all checks for a slot ─────────────────────────────────────────────────
async function runSlotAttendance({ room, slot, date, cameras, config }) {
  console.log(
    `[AutoScheduler] Starting slot=${slot} room=${room} date=${date} intervalMin=${config.checkIntervalMin}`,
  );

  const ctx = await resolveContext(room, slot);
  if (!ctx) {
    console.warn(
      `[AutoScheduler] No timetable context for room=${room} slot=${slot} — skipping`,
    );
    return;
  }

  const slotInfo = SLOT_SCHEDULE[slot];
  const totalMin = slotInfo.endMin - slotInfo.startMin;
  const checkCount = Math.floor(totalMin / config.checkIntervalMin);

  for (let i = 1; i <= checkCount; i++) {
    const waitMs = config.checkIntervalMin * 60 * 1000;
    console.log(
      `[AutoScheduler] Waiting ${config.checkIntervalMin} min before check ${i}/${checkCount}`,
    );
    await new Promise((r) => setTimeout(r, waitMs));
    await runOneCheck({
      room,
      slot,
      date,
      ctx,
      cameras,
      config,
      checkIndex: i,
    });
  }

  console.log(
    `[AutoScheduler] Slot ${slot} room ${room} — all ${checkCount} checks done`,
  );
}

// ── Check for missed/bunked classes after a slot ends ───────────────────────
async function checkMissedClasses(
  slotKey,
  date,
  roomCameraMap = ROOM_CAMERA_MAP,
) {
  try {
    const monitoredRooms = Object.keys(roomCameraMap);
    if (monitoredRooms.length === 0) return; // nothing to check

    const records = await LockSem.aggregate([
      { $match: { slot: { $regex: new RegExp(`^${slotKey}$`, "i") } } },
      {
        $lookup: {
          from: "timetables",
          localField: "timetable",
          foreignField: "_id",
          as: "tt",
        },
      },
      { $unwind: { path: "$tt", preserveNullAndEmptyArrays: false } },
      { $match: { "tt.currentSession": true } },
    ]);

    for (const rec of records) {
      for (const slotEntry of rec.slotData) {
        if (
          !monitoredRooms.some(
            (r) => r.toLowerCase() === slotEntry.room.toLowerCase(),
          )
        )
          continue;

        const ctx = await resolveContext(slotEntry.room, slotKey);
        if (!ctx) continue;

        const report = await AttendanceReport.findOne({
          batch: ctx.batch,
          date,
          timeSlot: slotKey,
        });

        if (!report) {
          try {
            await alertNotifier.notifyClassBunk({
              batch: ctx.batch,
              subject: ctx.subject,
              faculty: ctx.faculty,
              room: slotEntry.room,
              date,
              timeSlot: slotKey,
              dept: ctx.dept,
            });
          } catch (err) {
            console.error("[ClassBunkCheck] alert failed:", err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("[ClassBunkCheck] error:", err.message);
  }
}

// ── Main scheduler ────────────────────────────────────────────────────────────
function startAutoScheduler(
  roomCameraMap = ROOM_CAMERA_MAP,
  config = DEFAULT_CONFIG,
) {
  console.log("[AutoScheduler] Starting — running cron every minute");

  const triggeredToday = new Set();

  cron.schedule("* * * * *", async () => {
    const date = todayStr();
    const curMin = nowMin();

    for (const [slotKey, slotInfo] of Object.entries(SLOT_SCHEDULE)) {
      if (curMin < slotInfo.startMin || curMin > slotInfo.startMin + 1)
        continue;

      for (const [room, cameras] of Object.entries(roomCameraMap)) {
        const key = `${date}_${room}_${slotKey}`;
        if (triggeredToday.has(key)) continue;
        triggeredToday.add(key);

        runSlotAttendance({ room, slot: slotKey, date, cameras, config }).catch(
          (err) => console.error(`[AutoScheduler] Error: ${err.message}`),
        );
      }
    }

    // check for missed/bunked classes ~5 min after each slot ends
    for (const [slotKey, slotInfo] of Object.entries(SLOT_SCHEDULE)) {
      const checkAt = slotInfo.endMin + 5;
      if (curMin !== checkAt) continue;
      checkMissedClasses(slotKey, date, roomCameraMap).catch((err) =>
        console.error(`[ClassBunkCheck] Error: ${err.message}`),
      );
    }

    if (curMin === 0) triggeredToday.clear();
  });
}

module.exports = {
  startAutoScheduler,
  runSlotAttendance,
  checkMissedClasses,
  saveCheckResult,
  DEFAULT_CONFIG,
  ROOM_CAMERA_MAP,
};

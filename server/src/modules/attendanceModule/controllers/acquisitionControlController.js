// server/src/modules/attendanceModule/controllers/acquisitionControlController.js

const AcquisitionControl = require("../../../models/acquisitionControl");

// Helper — get or create the default profile
async function getOrCreateDefault() {
  let doc = await AcquisitionControl.findOne({ profileName: "default" });
  if (!doc) {
    doc = await AcquisitionControl.create({
      profileName: "default",
      periods: buildDefaultPeriods(),
    });
  }
  return doc;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDefaultPeriods() {
  const slots = [
    {
      periodKey: "period1",
      label: "Period 1",
      startTime: "08:30",
      endTime: "09:20",
    },
    {
      periodKey: "period2",
      label: "Period 2",
      startTime: "09:20",
      endTime: "10:10",
    },
    {
      periodKey: "period3",
      label: "Period 3",
      startTime: "10:10",
      endTime: "11:00",
    },
    {
      periodKey: "period4",
      label: "Period 4",
      startTime: "11:00",
      endTime: "11:50",
    },
    {
      periodKey: "period5",
      label: "Period 5 (Lunch)",
      startTime: "13:30",
      endTime: "14:20",
    },
    {
      periodKey: "period6",
      label: "Period 6",
      startTime: "14:20",
      endTime: "15:10",
    },
    {
      periodKey: "period7",
      label: "Period 7",
      startTime: "15:10",
      endTime: "16:00",
    },
    {
      periodKey: "period8",
      label: "Period 8",
      startTime: "16:00",
      endTime: "16:50",
    },
    {
      periodKey: "lunch1",
      label: "Lunch Slot 1",
      startTime: "12:00",
      endTime: "12:50",
      enabled: false,
    },
    {
      periodKey: "lunch2",
      label: "Lunch Slot 2",
      startTime: "12:50",
      endTime: "13:30",
      enabled: false,
    },
  ];
  return slots.map((s) => ({
    ...s,
    enabled: s.enabled !== false,
    numRuns: 1,
    runDurationSec: 120,
    checkIntervalMin: 5,
    presentLogic: "majority",
    stopForDay: false,
  }));
}

// ── GET /acquisitioncontrol ────────────────────────────────────────────────────
exports.getConfig = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── PATCH /acquisitioncontrol — update global settings ───────────────────────
exports.updateGlobal = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    const allowed = [
      "active",
      "globalPresentLogic",
      "globalNumRuns",
      "globalRunDurationSec",
      "globalCheckIntervalMin",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) doc[key] = req.body[key];
    }
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── PATCH /acquisitioncontrol/period/:periodKey ───────────────────────────────
exports.updatePeriod = async (req, res) => {
  try {
    const { periodKey } = req.params;
    const doc = await getOrCreateDefault();
    const idx = doc.periods.findIndex((p) => p.periodKey === periodKey);
    if (idx === -1) return res.status(404).json({ error: "Period not found" });
    const allowed = [
      "label",
      "startTime",
      "endTime",
      "enabled",
      "numRuns",
      "runDurationSec",
      "checkIntervalMin",
      "presentLogic",
      "stopForDay",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) doc.periods[idx][key] = req.body[key];
    }
    doc.markModified("periods");
    await doc.save();
    res.json(doc.periods[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── POST /acquisitioncontrol/stop-day — add a date to stoppedDays ────────────
exports.stopDay = async (req, res) => {
  try {
    const { date } = req.body; // "2026-06-07"
    if (!date) return res.status(400).json({ error: "date required" });
    const doc = await getOrCreateDefault();
    if (!doc.stoppedDays.includes(date)) {
      doc.stoppedDays.push(date);
      await doc.save();
    }
    res.json({ stoppedDays: doc.stoppedDays });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── DELETE /acquisitioncontrol/stop-day/:date — re-enable a stopped day ──────
exports.resumeDay = async (req, res) => {
  try {
    const { date } = req.params;
    const doc = await getOrCreateDefault();
    doc.stoppedDays = doc.stoppedDays.filter((d) => d !== date);
    await doc.save();
    res.json({ stoppedDays: doc.stoppedDays });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── POST /acquisitioncontrol/rooms — upsert a room override ──────────────────
exports.upsertRoom = async (req, res) => {
  try {
    const { room, enabled, rtspUrl1, rtspUrl2, note } = req.body;
    if (!room) return res.status(400).json({ error: "room required" });
    const doc = await getOrCreateDefault();
    const idx = doc.includedRooms.findIndex((r) => r.room === room);
    const entry = {
      room,
      enabled: enabled !== false,
      rtspUrl1,
      rtspUrl2,
      note,
    };
    if (idx === -1) doc.includedRooms.push(entry);
    else doc.includedRooms[idx] = entry;
    doc.markModified("includedRooms");
    await doc.save();
    res.json(doc.includedRooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── DELETE /acquisitioncontrol/rooms/:room ────────────────────────────────────
exports.removeRoom = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    doc.includedRooms = doc.includedRooms.filter(
      (r) => r.room !== req.params.room,
    );
    doc.markModified("includedRooms");
    await doc.save();
    res.json(doc.includedRooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addExtraClass = async (req, res) => {
  try {
    const {
      date,
      periodKey,
      room,
      subject,
      faculty,
      semester,
      isLunchHour,
      startTime,
      endTime,
      confirm,
    } = req.body;
    if (!date || !periodKey || !room) {
      return res.status(400).json({ error: "date, periodKey, room required" });
    }

    const doc = await getOrCreateDefault();

    // ── Check 1: duplicate extra class for same room+date+slot ──
    const duplicateExtra = doc.extraClasses.find(
      (ec) =>
        ec.active &&
        ec.room?.toLowerCase().trim() === room.toLowerCase().trim() &&
        ec.periodKey === periodKey &&
        ec.date === date,
    );
    if (duplicateExtra && !confirm) {
      return res.status(409).json({
        conflict: true,
        type: "extra_class",
        message: `Slot "${periodKey}" in room "${room}" on ${date} is already booked as an extra class (subject: ${duplicateExtra.subject || "n/a"}, faculty: ${duplicateExtra.faculty || "n/a"}). Replace it?`,
        existing: duplicateExtra,
      });
    }

    // ── Check 2: conflicts with regular timetable (LockSem) ─────
    let regularConflict = null;
    try {
      const LockSem = require("../../../models/locksem");
      const d = new Date(date);
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const day = days[d.getDay()];
      regularConflict = await LockSem.findOne({
        slot: periodKey,
        day,
        "slotData.room": { $regex: new RegExp(`^${room.trim()}$`, "i") },
      });
      if (regularConflict && !confirm) {
        const slotEntry = regularConflict.slotData.find(
          (s) => s.room?.toLowerCase() === room.toLowerCase(),
        );
        return res.status(409).json({
          conflict: true,
          type: "regular_timetable",
          message: `Slot "${periodKey}" in room "${room}" is already occupied by a regular timetable class (subject: ${slotEntry?.subject || "n/a"}, faculty: ${slotEntry?.faculty || "n/a"}) on ${day}s. Replace it with this extra class?`,
          existing: {
            subject: slotEntry?.subject,
            faculty: slotEntry?.faculty,
            day,
          },
        });
      }
    } catch (lockErr) {
      console.warn(
        "[addExtraClass] LockSem conflict check failed:",
        lockErr.message,
      );
    }

    // ── Confirmed replace: deactivate the conflicting extra class, if any ──
    if (duplicateExtra) duplicateExtra.active = false;

    doc.extraClasses.push({
      date,
      periodKey,
      room,
      subject,
      faculty,
      semester,
      isLunchHour,
      startTime,
      endTime,
      active: true,
      replacedRegular: !!regularConflict,
    });
    doc.markModified("extraClasses");
    await doc.save();
    res.json(doc.extraClasses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
// ── PATCH /acquisitioncontrol/extra-class/:id ─────────────────────────────────
exports.updateExtraClass = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    const item = doc.extraClasses.id(req.params.id);
    if (!item) return res.status(404).json({ error: "Extra class not found" });
    const fields = [
      "date",
      "periodKey",
      "room",
      "batch",
      "subject",
      "faculty",
      "semester",
      "isLunchHour",
      "startTime",
      "endTime",
      "active",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    }
    doc.markModified("extraClasses");
    await doc.save();
    res.json(doc.extraClasses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── DELETE /acquisitioncontrol/extra-class/:id ────────────────────────────────
exports.deleteExtraClass = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    doc.extraClasses = doc.extraClasses.filter(
      (e) => String(e._id) !== req.params.id,
    );
    doc.markModified("extraClasses");
    await doc.save();
    res.json(doc.extraClasses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── GET /acquisitioncontrol/class-lookup?date&sem&periodKey ──────────────────
// Step 1 of alteration flow: show what's originally scheduled for this slot.
exports.classLookup = async (req, res) => {
  try {
    const { date, sem, periodKey } = req.query;
    if (!date || !sem || !periodKey) {
      return res.status(400).json({ error: "date, sem, periodKey required" });
    }
    const LockSem = require("../../../models/locksem");
    const d = new Date(date);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const day = days[d.getDay()];

    const record = await LockSem.findOne({ sem, slot: periodKey, day });
    if (!record || !record.slotData || !record.slotData.length) {
      return res.json({ day, slotData: [] });
    }
    res.json({
      day,
      slotData: record.slotData.map((s) => ({
        room: s.room,
        subject: s.subject,
        faculty: s.faculty,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── GET /acquisitioncontrol/faculty-for-subject?sem&subject ──────────────────
// Step 3 of alteration flow: auto-fill faculty name for the chosen altering subject.
exports.facultyForSubject = async (req, res) => {
  try {
    const { sem, subject } = req.query;
    if (!sem || !subject) {
      return res.status(400).json({ error: "sem, subject required" });
    }
    const LockSem = require("../../../models/locksem");
    const record = await LockSem.findOne({
      sem,
      "slotData.subject": {
        $regex: new RegExp(`^${escapeRegex(subject.trim())}$`, "i"),
      },
    });
    if (!record) return res.json({ faculty: null });
    const entry = record.slotData.find(
      (s) => s.subject?.toLowerCase().trim() === subject.toLowerCase().trim(),
    );
    res.json({ faculty: entry?.faculty || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── POST /acquisitioncontrol/alteration ───────────────────────────────────────
// Step 4-5 of alteration flow: faculty-conflict-checked, one-time class swap.
exports.addAlteration = async (req, res) => {
  try {
    const {
      date,
      periodKey,
      room,
      sem,
      subject, // altering (new) subject
      faculty, // altering (new) faculty
      originalSubject, // snapshot, for audit/display
      originalFaculty,
      confirm,
    } = req.body;

    if (!date || !periodKey || !room || !sem || !subject || !faculty) {
      return res.status(400).json({
        error: "date, periodKey, room, sem, subject, faculty required",
      });
    }

    const doc = await getOrCreateDefault();
    const LockSem = require("../../../models/locksem");
    const d = new Date(date);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const day = days[d.getDay()];

    // ── Conflict 1: is the new faculty already teaching a regular class this period? ──
    const regularConflict = await LockSem.findOne({
      slot: periodKey,
      day,
      "slotData.faculty": {
        $regex: new RegExp(`^${escapeRegex(faculty.trim())}$`, "i"),
      },
    });
    if (regularConflict) {
      const slotEntry = regularConflict.slotData.find(
        (s) => s.faculty?.toLowerCase().trim() === faculty.toLowerCase().trim(),
      );
      return res.status(409).json({
        conflict: true,
        type: "faculty_regular_busy",
        message: `${faculty} is already teaching "${slotEntry?.subject || "another subject"}" (room ${slotEntry?.room || "n/a"}) during "${periodKey}" on ${day}s. Cannot alter.`,
      });
    }

    // ── Conflict 2: is the new faculty already covering a different alteration/extra class this exact period? ──
    const extraConflict = doc.extraClasses.find(
      (ec) =>
        ec.active &&
        ec.date === date &&
        ec.periodKey === periodKey &&
        ec.faculty?.toLowerCase().trim() === faculty.toLowerCase().trim() &&
        ec.room?.toLowerCase().trim() !== room.toLowerCase().trim(),
    );
    if (extraConflict) {
      return res.status(409).json({
        conflict: true,
        type: "faculty_already_altered",
        message: `${faculty} is already covering room "${extraConflict.room}" during "${periodKey}" on ${date}. Cannot alter.`,
      });
    }

    // ── Duplicate override for this exact room+date+slot ──
    const duplicate = doc.extraClasses.find(
      (ec) =>
        ec.active &&
        ec.room?.toLowerCase().trim() === room.toLowerCase().trim() &&
        ec.periodKey === periodKey &&
        ec.date === date,
    );
    if (duplicate && !confirm) {
      return res.status(409).json({
        conflict: true,
        type: "duplicate_slot",
        message: `Room "${room}" during "${periodKey}" on ${date} already has an override (subject: ${duplicate.subject || "n/a"}, faculty: ${duplicate.faculty || "n/a"}). Replace it?`,
        existing: duplicate,
      });
    }
    if (duplicate) duplicate.active = false;

    doc.extraClasses.push({
      date,
      periodKey,
      room,
      subject,
      faculty,
      semester: sem,
      active: true,
      replacedRegular: true,
      isAlteration: true,
      originalSubject: originalSubject || "",
      originalFaculty: originalFaculty || "",
    });
    doc.markModified("extraClasses");
    await doc.save();
    res.json(doc.extraClasses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
// ── GET /acquisitioncontrol/attendance-thresholds ────────────────────────────
exports.getAttendanceThresholds = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    res.json(doc.attendanceThresholds);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── PATCH /acquisitioncontrol/attendance-thresholds ──────────────────────────
exports.updateAttendanceThresholds = async (req, res) => {
  try {
    const doc = await getOrCreateDefault();
    const allowed = [
      "threshold",
      "auto_present_threshold",
      "review_threshold",
      "min_detections",
      "auto_enroll_threshold",
      "alert_confidence",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined)
        doc.attendanceThresholds[key] = Number(req.body[key]);
    }
    doc.markModified("attendanceThresholds");
    await doc.save();
    res.json(doc.attendanceThresholds);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── GET /acquisitioncontrol/subjects-for-sem?sem= ────────────────────────────
exports.subjectsForSem = async (req, res) => {
  try {
    const { sem } = req.query;
    if (!sem) return res.status(400).json({ error: "sem required" });
    const LockSem = require("../../../models/locksem");
    const records = await LockSem.find({ sem });
    const subjects = new Set();
    for (const rec of records) {
      for (const s of rec.slotData || []) {
        if (s.subject) subjects.add(s.subject.trim());
      }
    }
    res.json([...subjects].sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

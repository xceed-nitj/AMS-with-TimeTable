// server/src/modules/attendanceModule/controllers/acquisitionControlController.js

const AcquisitionControl = require('../../../models/acquisitionControl');

// Helper — get or create the default profile
async function getOrCreateDefault() {
  let doc = await AcquisitionControl.findOne({ profileName: 'default' });
  if (!doc) {
    doc = await AcquisitionControl.create({
      profileName: 'default',
      periods: buildDefaultPeriods(),
    });
  }
  return doc;
}

function buildDefaultPeriods() {
  const slots = [
    { periodKey: 'period1', label: 'Period 1', startTime: '08:30', endTime: '09:20' },
    { periodKey: 'period2', label: 'Period 2', startTime: '09:20', endTime: '10:10' },
    { periodKey: 'period3', label: 'Period 3', startTime: '10:10', endTime: '11:00' },
    { periodKey: 'period4', label: 'Period 4', startTime: '11:00', endTime: '11:50' },
    { periodKey: 'period5', label: 'Period 5 (Lunch)', startTime: '13:30', endTime: '14:20' },
    { periodKey: 'period6', label: 'Period 6', startTime: '14:20', endTime: '15:10' },
    { periodKey: 'period7', label: 'Period 7', startTime: '15:10', endTime: '16:00' },
    { periodKey: 'period8', label: 'Period 8', startTime: '16:00', endTime: '16:50' },
    { periodKey: 'lunch1',  label: 'Lunch Slot 1', startTime: '12:00', endTime: '12:50', enabled: false },
    { periodKey: 'lunch2',  label: 'Lunch Slot 2', startTime: '12:50', endTime: '13:30', enabled: false },
  ];
  return slots.map(s => ({
    ...s,
    enabled: s.enabled !== false,
    numRuns: 1,
    runDurationSec: 120,
    checkIntervalMin: 5,
    presentLogic: 'majority',
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
      'active', 'globalPresentLogic', 'globalNumRuns',
      'globalRunDurationSec', 'globalCheckIntervalMin',
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
    const idx = doc.periods.findIndex(p => p.periodKey === periodKey);
    if (idx === -1) return res.status(404).json({ error: 'Period not found' });
    const allowed = [
      'label', 'startTime', 'endTime', 'enabled', 'numRuns',
      'runDurationSec', 'checkIntervalMin', 'presentLogic', 'stopForDay',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) doc.periods[idx][key] = req.body[key];
    }
    doc.markModified('periods');
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
    if (!date) return res.status(400).json({ error: 'date required' });
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
    doc.stoppedDays = doc.stoppedDays.filter(d => d !== date);
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
    if (!room) return res.status(400).json({ error: 'room required' });
    const doc = await getOrCreateDefault();
    const idx = doc.includedRooms.findIndex(r => r.room === room);
    const entry = { room, enabled: enabled !== false, rtspUrl1, rtspUrl2, note };
    if (idx === -1) doc.includedRooms.push(entry);
    else doc.includedRooms[idx] = entry;
    doc.markModified('includedRooms');
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
    doc.includedRooms = doc.includedRooms.filter(r => r.room !== req.params.room);
    doc.markModified('includedRooms');
    await doc.save();
    res.json(doc.includedRooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── POST /acquisitioncontrol/extra-class ─────────────────────────────────────
exports.addExtraClass = async (req, res) => {
  try {
    const { date, periodKey, room, batch, subject, faculty, semester, isLunchHour, startTime, endTime } = req.body;
    if (!date || !periodKey || !room || !batch) {
      return res.status(400).json({ error: 'date, periodKey, room, batch required' });
    }
    const doc = await getOrCreateDefault();
    doc.extraClasses.push({ date, periodKey, room, batch, subject, faculty, semester, isLunchHour, startTime, endTime, active: true });
    doc.markModified('extraClasses');
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
    if (!item) return res.status(404).json({ error: 'Extra class not found' });
    const fields = ['date','periodKey','room','batch','subject','faculty','semester','isLunchHour','startTime','endTime','active'];
    for (const f of fields) {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    }
    doc.markModified('extraClasses');
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
    doc.extraClasses = doc.extraClasses.filter(e => String(e._id) !== req.params.id);
    doc.markModified('extraClasses');
    await doc.save();
    res.json(doc.extraClasses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
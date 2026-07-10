// server/src/models/acquisitionControl.js
const mongoose = require("mongoose");

// ── Per-period config (up to 8 periods + optional lunch slots) ────────────────
const PeriodConfigSchema = new mongoose.Schema(
  {
    periodKey: { type: String, required: true }, // 'period1' … 'period8', 'lunch1', 'lunch2'
    label: { type: String }, // display label e.g. "Period 1 — 08:30"
    startTime: { type: String }, // "08:30"
    endTime: { type: String }, // "09:20"
    enabled: { type: Boolean, default: true }, // false = skip this period entirely
    numRuns: { type: Number, default: 1, min: 1, max: 10 },
    runDurationSec: { type: Number, default: 120 }, // seconds per run
    checkIntervalMin: { type: Number, default: 5 }, // minutes between runs
    presentLogic: {
      type: String,
      enum: ["majority", "any_run", "all_runs", "first_run"],
      default: "majority",
    },
    stopForDay: { type: Boolean, default: false }, // manual kill-switch for today
  },
  { _id: false },
);

// ── Extra / Lunch class override ──────────────────────────────────────────────
const ReplacedClassSchema = new mongoose.Schema(
  {
    subject: { type: String },
    faculty: { type: String },
    batch: { type: String },
    locksemId: { type: String },
  },
  { _id: false },
);

const ExtraClassSchema = new mongoose.Schema({
  date: { type: String },
  periodKey: { type: String },
  room: { type: String, required: true },
  batch: { type: String },
  subject: { type: String },
  faculty: { type: String },
  semester: { type: String },
  isLunchHour: { type: Boolean, default: false },
  startTime: { type: String },
  endTime: { type: String },
  active: { type: Boolean, default: true },
  replacedRegular: { type: Boolean, default: false },
  // ── new: class-alteration specific fields ──
  isAlteration: { type: Boolean, default: false }, // true = faculty swap, not a brand-new extra class
  originalSubject: { type: String }, // snapshot of what was scheduled before the swap
  originalFaculty: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// ── Room-Camera binding override (overrides camera.jsx DB entries) ────────────
const RoomOverrideSchema = new mongoose.Schema(
  {
    room: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    rtspUrl1: { type: String }, // front-left override (blank = use camera DB)
    rtspUrl2: { type: String }, // front-right override
    note: { type: String },
  },
  { _id: false },
);

// ── Main config document (one per "profile", default profile always exists) ────
const AcquisitionControlSchema = new mongoose.Schema(
  {
    profileName: { type: String, default: "default", unique: true },
    active: { type: Boolean, default: true },

    // Global present logic (can be overridden per period)
    globalPresentLogic: {
      type: String,
      enum: ["majority", "any_run", "all_runs", "first_run"],
      default: "majority",
    },
    globalNumRuns: { type: Number, default: 1, min: 1, max: 10 },
    globalRunDurationSec: { type: Number, default: 120 },
    globalCheckIntervalMin: { type: Number, default: 5 },

    // Per-period overrides
    periods: { type: [PeriodConfigSchema], default: [] },

    // Rooms included in acquisition (empty = all rooms)
    includedRooms: { type: [RoomOverrideSchema], default: [] },

    // Extra classes scheduled outside normal timetable
    extraClasses: { type: [ExtraClassSchema], default: [] },

    // Days where acquisition is fully stopped (ISO date strings)
    stoppedDays: { type: [String], default: [] },

    // ML thresholds used during live attendance runs
    attendanceThresholds: {
      threshold: { type: Number, default: 0.45 }, // face recognition similarity
      auto_present_threshold: { type: Number, default: 0.6 }, // mark as Present
      review_threshold: { type: Number, default: 0.4 }, // mark for Review
      min_detections: { type: Number, default: 3 }, // min face detections to count
      auto_enroll_threshold: { type: Number, default: 0.75 }, // auto-add to ground truth
      alert_confidence: { type: Number, default: 0.6 }, // low-confidence alert cutoff
    },

    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Auto-touch updatedAt on save
AcquisitionControlSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("AcquisitionControl", AcquisitionControlSchema);

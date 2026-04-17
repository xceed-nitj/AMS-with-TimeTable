// server/src/models/attendanceReport.js
// Stores one attendance session report (per video / per time slot)

const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');

// Per-student record inside a report
const studentAttendanceSchema = new Schema({
    rollNo:          { type: String, required: true },
    status:          { type: String, enum: ['present', 'absent', 'review', 'not_enrolled'], default: 'absent' },
    avgConfidence:   { type: Number, default: 0 },
    confidenceZone:  { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
    firstSeenSec:    { type: Number, default: null },
    clusterFolder:   { type: String, default: null },
    // logic merge: if multiple time slots
    finalStatus:     { type: String, enum: ['P', 'A', 'R'], default: 'A' },
}, { _id: false });

// Per-time-slot sub-document (matches notebook: 8:45, 9:00, 9:15 columns)
const slotResultSchema = new Schema({
    slot:        { type: String, required: true },   // e.g. "8:30-9:30"
    videoLink:   { type: String, default: '' },
    frameSnapshot: { type: String, default: '' },
    processedAt: { type: Date,   default: Date.now },
    students:    [studentAttendanceSchema],
    summary: {
        present:  { type: Number, default: 0 },
        absent:   { type: Number, default: 0 },
        review:   { type: Number, default: 0 },
        total:    { type: Number, default: 0 },
        processingTimeSec: { type: Number, default: 0 },
    }
}, { _id: false });

// Top-level attendance report — one doc per class session
const attendanceReportSchema = new Schema({
    // Context (from locksem / timetable)
    batch:       { type: String, required: true },   // e.g. "BTECH_EE_2022"
    department:  { type: String, default: '' },
    semester:    { type: String, default: '' },
    subject:     { type: String, default: '' },
    faculty:     { type: String, default: '' },
    room:        { type: String, default: '' },
    date:        { type: String, required: true },   // "YYYY-MM-DD"
    timeSlot:    { type: String, default: '' },      // "8:30-9:30"
    locksemId:   { type: Schema.Types.ObjectId, ref: 'LockSem', default: null },

    // One entry per video processed in this session
    slotResults: [slotResultSchema],

    // Merged final roll → status map (computed after all slots processed)
    finalReport: [studentAttendanceSchema],

    // Overall session summary
    summary: {
        totalStudents: { type: Number, default: 0 },
        present:       { type: Number, default: 0 },
        absent:        { type: Number, default: 0 },
        review:        { type: Number, default: 0 },
        attendancePct: { type: Number, default: 0 },
    },

    status: {
        type: String,
        enum: ['draft', 'finalized','live'],
        default: 'draft',
    },
});

attendanceReportSchema.add(commonFields);
attendanceReportSchema.pre('save', updateTimestamps);

// Unique index: exactly ONE report per batch + date + timeSlot
attendanceReportSchema.index({ batch: 1, date: 1, timeSlot: 1 }, { unique: true });
attendanceReportSchema.index({ faculty: 1, date: -1 });

const AttendanceReport = mongoose.model('AttendanceReport', attendanceReportSchema);
module.exports = AttendanceReport;

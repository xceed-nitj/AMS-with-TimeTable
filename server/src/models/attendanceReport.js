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
    // Demographics from InsightFace's genderage head — captured for free
    // during the same detection pass that produces the embedding. Used to
    // cross-check against the enrolled student's recorded gender/age before
    // a "present" mark is trusted.
    detectedAge:     { type: Number, default: null },
    detectedGender:  { type: String, enum: ['M', 'F', null], default: null },
    genderMismatch:  { type: Boolean, default: false },  // true if detectedGender != Student.gender
    // logic merge: if multiple time slots
    finalStatus:     { type: String, enum: ['P', 'A', 'R'], default: 'A' },
    // ERP override: set to true when ERP system changes a student's finalStatus
    isOverridden:    { type: Boolean, default: false },
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

// Save data for proxy roll numbers: students appearing in different rooms at same time period
const proxyStudentSchema = new Schema({
    rollNo: {
        type: String,
        required: true,
    },

    otherReports: [{
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "AttendanceReport",
            required: true,
        },
        room: {
            type: String,
            default: "",
        },
        subject: {
            type: String,
            default: "",
        },
        faculty: {
            type: String,
            default: "",
        },
    }],
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

     // Subject metadata for ERP push — resolved from Subject model at save-time
    // (free-text `subject` above is timetable text; ERP needs the real code/abbrev)
    subjectMeta: {
        subName:         { type: String, default: '' },   // abbreviation e.g. "DSP"
        subCode:         { type: String, default: '' },   // e.g. "ECPC_306"
        subjectFullName: { type: String, default: '' },
        credits:         { type: Number, default: null },
    },

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
        unknownFaceCount:{ type: Number, default: 0 },
    },

    // Students detected in multiple rooms for the same date & timeSlot
    hasProxyStudents: {
        type: Boolean,
        default: false,
    },

    proxyStudents: {
        type: [proxyStudentSchema],
        default: [],
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

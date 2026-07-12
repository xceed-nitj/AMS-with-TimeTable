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
    // ERP override: set to true when the ERP system records an override for
    // this student. The override itself lives in erpOverriddenStatus below —
    // finalStatus is NEVER mutated by an ERP override.
    isOverridden:    { type: Boolean, default: false },
    // ERP's corrected status, kept separate from finalStatus so our own
    // attendance data is never overwritten. null = no ERP override recorded.
    erpOverriddenStatus: { type: String, enum: ['P', 'A', 'R', null], default: null },
    erpOverriddenAt:     { type: Date, default: null },
    // Model's original P/A/R decision at merge time — never modified by
    // updateStudentStatus(). Preserved so accuracy metrics can compare the
    // model's call against any later human correction without ambiguity.
    autoFinalStatus: { type: String, enum: ['P', 'A', 'R', null], default: null },
    // Reason the faculty gave for the override, entered on the ERP side and
    // forwarded to us via the same override call — read-only here.
    facultyRemark:   { type: String, default: '' },
    // Dept coordinator's fixed-vocabulary verification remark (ERP Overrides page).
    coordinatorRemark: {
        type: String,
        enum: [
            'No ground truth',
            'Student came late',
            'Change in student appearance',
            'Sitting in last row',
            'Sitting in middle row',
            'Lighting issues',
            null,
            '',
        ],
        default: null,
    },
    // Flips true once a coordinatorRemark has been saved for this student.
    coordinatorVerified: { type: Boolean, default: false },
}, { _id: false });

const COORDINATOR_REMARK_OPTIONS = [
    'No ground truth',
    'Student came late',
    'Change in student appearance',
    'Sitting in last row',
    'Sitting in middle row',
    'Lighting issues',
];

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
    },
    // Diagnostic-only shadow comparison against max-of-K embedding scoring
    // (state.max_k_config, ML Fine Tuning page) for this one period check —
    // never factored into `students`/`summary` above, which always come from
    // the primary mean-embedding assignment. Shape varies ({enabled:false} |
    // {enabled:true, skipped:true, ...} | full agree/disagree breakdown), so
    // left schemaless.
    matchingComparison: { type: Schema.Types.Mixed, default: null },
    // Same idea, but against the full FAISS index (state.faiss_config
    // ["shadow_enabled"], ML Fine Tuning page) instead of top-K embeddings.
    faissComparison: { type: Schema.Types.Mixed, default: null },
    // Same idea, but against AdaFace — an entirely independent
    // face-recognition model (state.adaface_config, ML Fine Tuning page).
    adafaceComparison: { type: Schema.Types.Mixed, default: null },
    // Classic mean-embedding assignment as a shadow — only populated when a
    // different model was the primary (Model Pipeline card).
    meanComparison: { type: Schema.Types.Mixed, default: null },
    // Which model actually DECIDED attendance for this check (Model Pipeline
    // card) — 'mean' unless another primary was selected and its
    // prerequisites were met. primaryFallback=true means a non-mean primary
    // was configured but unavailable, so this check fell back to mean.
    primaryModel:    { type: String, enum: ['mean', 'max_k', 'faiss', 'adaface'], default: 'mean' },
    primaryFallback: { type: Boolean, default: false },
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

    // Structured, deterministic id (batch+room+date+timeSlot, sanitized) —
    // NOT a random uuid, so it's stable if the report doc is ever resaved.
    // Set once on first save (see pre-save hook below) and included on every
    // ERP push payload; ERP echoes it back on override-sync callbacks and
    // status lookups (XCEED–ERP Attendance Integration spec §4, §17).
    periodId:        { type: String, default: null },
    // Moment the recognition result was captured/finalised on our side —
    // set once on first save, reused verbatim on every retry (spec §11).
    // Distinct from erpPush.lastAttemptAt / sentAt, which track OUR delivery
    // attempts, not when recognition itself happened.
    xceedTimestamp:  { type: Date, default: null },
    // Set when ERP's faculty-override-sync callback reports the period as
    // faculty-finalised (spec §13.1) — echoes ERP's facultyLockedAt as-is.
    facultyLockedAt: { type: Date, default: null },
    // One-way lock state per spec §7: whichever side reaches finality first
    // closes the other side's write path for that period.
    //   none              — no push acked yet, no faculty lock yet
    //   posted_acked      — ERP accepted our post (2xx); further posts blocked
    //   faculty_finalized — ERP reported (via 409 or override-sync) that
    //                       faculty already finalised this period
    erpLockState: { type: String, enum: ['none', 'posted_acked', 'faculty_finalized'], default: 'none' },

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

    // Outbound push of finalReport (roll no + finalStatus) to the external
    // ERP's attendance-posting endpoint — see erpAttendancePushController.js.
    // Per spec §7, a period gets at most one accepted/finalised outcome:
    // once erpLockState leaves 'none', no further pushes are attempted.
    erpPush: {
        status:        { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
        attempts:      { type: Number, default: 0 },
        lastAttemptAt: { type: Date, default: null },
        sentAt:        { type: Date, default: null },   // set once ERP acks success
        lastError:     { type: String, default: null },
        lastResponse:  { type: Schema.Types.Mixed, default: null },
        // HTTP status code of the most recent push attempt (e.g. 200, 500);
        // null when the request never reached ERP (timeout / network error).
        // Surfaced in the ERP sync table on the frontend.
        lastResponseCode: { type: Number, default: null },
        // Business-level response code from the spec's envelope (e.g.
        // "ATTENDANCE_ACCEPTED", "PERIOD_ALREADY_FINALIZED") — distinct from
        // lastResponseCode, which is just the raw HTTP status.
        responseCode:  { type: String, default: null },
        // Roll numbers ERP discarded (not in its roster) or otherwise
        // flagged on an ATTENDANCE_ACCEPTED_WITH_FLAGS response (spec §6,
        // §12.1) — stored as-is for review; no XCEED-side workflow built on
        // top of these yet.
        flags:         { type: [Schema.Types.Mixed], default: [] },
        idempotencyKey:{ type: String, default: null }, // hash of reportId + finalReport content
    },
});

// periodId / xceedTimestamp are set once, on first save, and never
// regenerated — both must stay stable across retries (spec §4, §11).
attendanceReportSchema.pre('save', function setErpIdentity(next) {
    if (!this.periodId) {
        const clean = (v) => String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        this.periodId = [clean(this.batch), clean(this.room), clean(this.date), clean(this.timeSlot)]
            .filter(Boolean)
            .join('-');
    }
    if (!this.xceedTimestamp) {
        this.xceedTimestamp = new Date();
    }
    next();
});

attendanceReportSchema.add(commonFields);
attendanceReportSchema.pre('save', updateTimestamps);

// Unique index: exactly ONE report per batch + date + timeSlot
attendanceReportSchema.index({ batch: 1, date: 1, timeSlot: 1 }, { unique: true });
attendanceReportSchema.index({ faculty: 1, date: -1 });
// ERP override-sync callbacks and status lookups address a report by periodId
attendanceReportSchema.index({ periodId: 1 }, { sparse: true });

const AttendanceReport = mongoose.model('AttendanceReport', attendanceReportSchema);
module.exports = AttendanceReport;
module.exports.COORDINATOR_REMARK_OPTIONS = COORDINATOR_REMARK_OPTIONS;

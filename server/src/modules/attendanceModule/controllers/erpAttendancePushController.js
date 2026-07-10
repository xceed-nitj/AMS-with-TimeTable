// server/src/modules/attendanceModule/controllers/erpAttendancePushController.js
//
// Outbound push: sends each report's finalReport (roll no + finalStatus) to
// the external ERP's attendance-posting endpoint after every completed run
// (see saveCheckResult in autoAttendanceScheduler.js, called right after
// finalReport is recomputed). A later manual override re-triggers a push
// with a new idempotency key, so ERP always converges on the current
// authoritative value.
//
// ── Configuration (env) ──────────────────────────────────────────────────────
//   ERP_ATTENDANCE_PUSH_URL  required — full URL of ERP's attendance-posting
//                            endpoint, e.g. https://erp.example.edu/api/attendance
//   ERP_PUSH_SECRET          required — shared secret used to HMAC-sign each
//                            request body. Never sent over the wire itself —
//                            only the signature is. Rotate via env, not DB.
//
// ── Request shape sent to ERP ────────────────────────────────────────────────
//   POST ERP_ATTENDANCE_PUSH_URL
//   Headers:
//     Content-Type:      application/json
//     X-Timestamp:       <ms since epoch, string>
//     X-Idempotency-Key: sha256(reportId + sorted roll->status pairs)
//     X-Signature:       HMAC-SHA256(secret, `${timestamp}.${rawBody}`), hex
//   Body:
//     { reportId, batch, department, semester, subject, subCode, date,
//       timeSlot, students: [{ rollNo, finalStatus }] }
//
// ── Expected ERP response ────────────────────────────────────────────────────
//   Any 2xx status is treated as success unless the body explicitly carries
//   `success: false`. Non-2xx / network errors / timeouts are recorded as
//   failed and retried on a backoff schedule (see startErpPushRetryScheduler).

const crypto = require('crypto');
const axios  = require('axios');
const cron   = require('node-cron');
const AttendanceReport = require('../../../models/attendanceReport');
const ErpPushSettings  = require('../../../models/attendanceModule/erpPushSettings');

const ERP_ATTENDANCE_PUSH_URL = process.env.ERP_ATTENDANCE_PUSH_URL || '';
const ERP_PUSH_SECRET         = process.env.ERP_PUSH_SECRET || '';

const MAX_AUTO_ATTEMPTS = 8;
const BASE_BACKOFF_MS   = 60 * 1000;       // 1 min
const MAX_BACKOFF_MS    = 30 * 60 * 1000;  // 30 min

function erpPushConfigured() {
    return !!(ERP_ATTENDANCE_PUSH_URL.trim() && ERP_PUSH_SECRET.trim());
}

function backoffMs(attempts) {
    return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempts));
}

function buildStudents(report) {
    return (report.finalReport || [])
        .map((s) => ({ rollNo: s.rollNo, finalStatus: s.finalStatus }))
        .sort((a, b) => a.rollNo.localeCompare(b.rollNo));
}

function computeIdempotencyKey(reportId, students) {
    const hash = crypto.createHash('sha256');
    hash.update(String(reportId) + ':' + JSON.stringify(students));
    return hash.digest('hex');
}

function signBody(rawBody, timestamp) {
    return crypto
        .createHmac('sha256', ERP_PUSH_SECRET)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
}

// Push one report's current finalReport to ERP. Always resolves (never
// throws) — failure is recorded on report.erpPush, not surfaced as an
// exception, so callers (the scheduler, the retry job) never need a
// try/catch of their own around this.
async function pushAttendanceToErp(report) {
    if (!erpPushConfigured()) {
        console.log('[ErpPush] ERP_ATTENDANCE_PUSH_URL/ERP_PUSH_SECRET not configured — skipping push.');
        return { skipped: true, reason: 'not_configured' };
    }

    const settings = await ErpPushSettings.getSettings();
    if (!settings.enabled) {
        return { skipped: true, reason: 'disabled' };
    }

    const students = buildStudents(report);
    const idempotencyKey = computeIdempotencyKey(report._id, students);

    // Nothing changed since the last confirmed-successful push — skip the
    // network round-trip entirely.
    if (report.erpPush?.status === 'sent' && report.erpPush?.idempotencyKey === idempotencyKey) {
        return { skipped: true, reason: 'unchanged' };
    }

    const payload = {
        reportId: String(report._id),
        batch: report.batch,
        department: report.department,
        semester: report.semester,
        subject: report.subjectMeta?.subjectFullName || report.subject,
        subCode: report.subjectMeta?.subCode || '',
        date: report.date,
        timeSlot: report.timeSlot,
        students,
    };
    const rawBody = JSON.stringify(payload);
    const timestamp = String(Date.now());
    const signature = signBody(rawBody, timestamp);

    const attempts = (report.erpPush?.attempts || 0) + 1;
    const now = new Date();

    try {
        const res = await axios.post(ERP_ATTENDANCE_PUSH_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Timestamp': timestamp,
                'X-Idempotency-Key': idempotencyKey,
                'X-Signature': signature,
            },
            timeout: 15000,
        });

        const ok = res.status >= 200 && res.status < 300 && res.data?.success !== false;
        if (!ok) {
            throw new Error(`ERP responded ${res.status} with success=false`);
        }

        report.erpPush = {
            status: 'sent',
            attempts,
            lastAttemptAt: now,
            sentAt: now,
            lastError: null,
            lastResponse: res.data ?? null,
            idempotencyKey,
        };
        await report.save();
        console.log(`[ErpPush] ${report.batch} ${report.date} ${report.timeSlot} — sent (${students.length} students).`);
        return { ok: true };
    } catch (err) {
        const errMessage = err.response
            ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data).slice(0, 500)}`
            : err.message;
        report.erpPush = {
            status: 'failed',
            attempts,
            lastAttemptAt: now,
            sentAt: report.erpPush?.sentAt || null,
            lastError: errMessage,
            lastResponse: err.response?.data ?? null,
            idempotencyKey,
        };
        await report.save();
        console.warn(`[ErpPush] ${report.batch} ${report.date} ${report.timeSlot} — failed (attempt ${attempts}): ${errMessage}`);
        return { ok: false, error: errMessage };
    }
}

// Background retry — finds reports stuck pending/failed whose backoff window
// has elapsed and haven't exhausted MAX_AUTO_ATTEMPTS, and retries them
// sequentially (kind to the ERP server, matches erpAutoSyncScheduler.js).
async function retryFailedPushes() {
    if (!erpPushConfigured()) return;
    const settings = await ErpPushSettings.getSettings();
    if (!settings.enabled) return;

    const candidates = await AttendanceReport.find({
        'erpPush.status': { $in: ['pending', 'failed'] },
        'erpPush.attempts': { $lt: MAX_AUTO_ATTEMPTS },
    });

    const now = Date.now();
    const due = candidates.filter((r) => {
        if (!r.erpPush?.lastAttemptAt) return true; // never attempted yet
        const elapsed = now - new Date(r.erpPush.lastAttemptAt).getTime();
        return elapsed >= backoffMs(r.erpPush.attempts || 0);
    });

    if (!due.length) return;
    console.log(`[ErpPush] Retry sweep — ${due.length} report(s) due.`);
    for (const report of due) {
        await pushAttendanceToErp(report);
    }
}

function startErpPushRetryScheduler() {
    cron.schedule('*/5 * * * *', () => {
        retryFailedPushes().catch((err) =>
            console.error('[ErpPush] Retry sweep error:', err.message));
    });
    console.log('[ErpPush] Retry scheduler registered — sweeps every 5 min');
}

// ── Express handlers ─────────────────────────────────────────────────────────

// GET /erp-push/settings
async function getSettings(req, res) {
    try {
        const settings = await ErpPushSettings.getSettings();
        res.json({ enabled: settings.enabled, configured: erpPushConfigured() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// PATCH /erp-push/settings  { enabled }
async function updateSettings(req, res) {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled (boolean) is required' });
        }
        const settings = await ErpPushSettings.getSettings();
        settings.enabled = enabled;
        await settings.save();
        res.json({ enabled: settings.enabled });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// GET /erp-push/status?status=&limit=&skip=
async function getPushStatus(req, res) {
    try {
        const { status, limit = 100, skip = 0 } = req.query;
        const filter = {};
        if (status) filter['erpPush.status'] = status;

        const reports = await AttendanceReport.find(filter)
            .select('batch department semester subject room date timeSlot summary erpPush')
            .sort({ date: -1, createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));

        const total = await AttendanceReport.countDocuments(filter);
        res.json({
            configured: erpPushConfigured(),
            items: reports.map((r) => ({
                reportId: r._id,
                batch: r.batch,
                department: r.department,
                semester: r.semester,
                subject: r.subject,
                room: r.room,
                date: r.date,
                timeSlot: r.timeSlot,
                summary: { present: r.summary?.present || 0, absent: r.summary?.absent || 0 },
                erpPush: r.erpPush,
            })),
            total,
            skip: Number(skip),
            limit: Number(limit),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /erp-push/:reportId/retry — manual retry, bypasses the backoff/attempt cap.
async function retryOne(req, res) {
    try {
        const report = await AttendanceReport.findById(req.params.reportId);
        if (!report) return res.status(404).json({ error: 'Report not found' });
        const result = await pushAttendanceToErp(report);
        res.json({ result, erpPush: report.erpPush });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    erpPushConfigured,
    pushAttendanceToErp,
    retryFailedPushes,
    startErpPushRetryScheduler,
    getSettings,
    updateSettings,
    getPushStatus,
    retryOne,
};

// server/src/modules/attendanceModule/controllers/erpAttendancePushController.js
//
// Outbound push: sends each report's finalReport as a recognition result to
// ERP's attendance-posting endpoint after every completed run (see
// saveCheckResult in autoAttendanceScheduler.js, called right after
// finalReport is recomputed). Follows the XCEED–ERP Attendance Integration
// spec: structured periodId + xceedTimestamp (both minted once, on the
// report's first save — see the pre-save hook in models/attendanceReport.js
// — and reused verbatim on every retry), and one of six responseCodes that
// this controller branches on deterministically (spec §12).
//
// ── Configuration (env) ──────────────────────────────────────────────────────
//   ERP_ATTENDANCE_PUSH_URL  required — full URL of ERP's attendance-posting
//                            endpoint, e.g. https://erp.example.edu/api/xceed/attendance
//   ERP_PUSH_SECRET          required — shared secret used to HMAC-sign each
//                            request body. Never sent over the wire itself —
//                            only the signature is. Rotate via env, not DB.
//
// ── Request shape sent to ERP (spec §11) ─────────────────────────────────────
//   POST ERP_ATTENDANCE_PUSH_URL
//   Headers:
//     Content-Type:      application/json
//     X-Timestamp:       <ms since epoch, string>
//     X-Idempotency-Key: sha256(reportId + sorted roll->status pairs)
//     X-Signature:       HMAC-SHA256(secret, `${timestamp}.${rawBody}`), hex
//   Body:
//     { periodId, classId, sessionDate, xceedTimestamp,
//       recognitionResults: [{ rollNo, status: 'PRESENT'|'ABSENT', confidence }] }
//   Review-status students (finalStatus 'R') are posted as ABSENT — ERP has
//   no equivalent of our review state; the stored finalStatus on our side is
//   untouched, only the value SENT to ERP is mapped.
//
// ── Expected ERP response (spec §12) ─────────────────────────────────────────
//   Envelope: { status, responseCode, periodId, xceedTimestamp, message?, flags? }
//   responseCode branches:
//     ATTENDANCE_ACCEPTED            (200) → sent, erpLockState=posted_acked
//     ATTENDANCE_ACCEPTED_WITH_FLAGS (200) → sent, erpLockState=posted_acked,
//                                             flags[] stored as-is for review
//     PERIOD_ALREADY_FINALIZED       (409) → permanent failure,
//                                             erpLockState=faculty_finalized
//     PERIOD_ALREADY_POSTED          (409) → treated as success (duplicate/
//                                             retry no-op)
//     FUTURE_PERIOD_REJECTED         (422) → permanent failure, no retry
//     INVALID_PAYLOAD                (400) → permanent failure, no retry
//   Any other/unexpected response is treated as a transient failure and
//   retried per the schedule below.
//
// ── Locking (spec §7, §10) ────────────────────────────────────────────────────
//   Once erpLockState leaves 'none' (either an acked post or a faculty
//   finalisation), no further push is attempted for that period — whichever
//   side reaches finality first is authoritative.

const crypto = require('crypto');
const axios  = require('axios');
const cron   = require('node-cron');
const AttendanceReport = require('../../../models/attendanceReport');
const ErpPushSettings  = require('../../../models/attendanceModule/erpPushSettings');

const ERP_ATTENDANCE_PUSH_URL = process.env.ERP_ATTENDANCE_PUSH_URL || '';
const ERP_PUSH_SECRET         = process.env.ERP_PUSH_SECRET || '';

// maxAttempts / retryIntervalMinutes are admin-editable (ErpPushSettings —
// see the ERP Controls page's Retry Policy card, GET/PATCH /erp-push/settings)
// rather than fixed constants. DEFAULT_* here only seed the schema default
// and back a fallback if settings somehow fail to load. The fast sweep ticks
// every minute and itself checks each report's elapsed time against the
// configured interval, so changing the interval takes effect immediately —
// no cron reschedule/restart needed.
const DEFAULT_MAX_ATTEMPTS          = 2;
const DEFAULT_RETRY_INTERVAL_MINUTES = 3;
const FAST_SWEEP_CRON = '* * * * *';
// Second, independent pass late in the day that retries every still-failed
// period bypassing maxAttempts — a safety net beyond the fast sweep's cap.
// Gated by ErpPushSettings.nightlyRetryEnabled; time of day is fixed here
// (not admin-editable, only on/off is).
const NIGHTLY_RETRY_CRON = '0 20 * * *'; // 20:00 daily

function erpPushConfigured() {
    return !!(ERP_ATTENDANCE_PUSH_URL.trim() && ERP_PUSH_SECRET.trim());
}

// classId mirrors erpSyncController.js's erpSubjectKey convention (semester +
// subject abbreviation, uppercased, no spaces — e.g. "6DE") so the same class
// identifier scheme is used across roster fetch and attendance posting.
function buildClassId(report) {
    const sem = String(report.semester || '').trim();
    const abbrev = String(report.subjectMeta?.subName || report.subject || '')
        .replace(/\s+/g, '').toUpperCase();
    return `${sem}${abbrev}`;
}

// PRESENT/ABSENT only — ERP has no "review" concept, so R posts as ABSENT.
// This affects only what's SENT to ERP; the stored finalStatus is untouched.
function mapStatusForErp(finalStatus) {
    return finalStatus === 'P' ? 'PRESENT' : 'ABSENT';
}

function buildRecognitionResults(report) {
    return (report.finalReport || [])
        .map((s) => ({
            rollNo: s.rollNo,
            status: mapStatusForErp(s.finalStatus),
            confidence: typeof s.avgConfidence === 'number' ? Number(s.avgConfidence.toFixed(2)) : 0,
        }))
        .sort((a, b) => a.rollNo.localeCompare(b.rollNo));
}

function computeIdempotencyKey(reportId, recognitionResults) {
    const hash = crypto.createHash('sha256');
    hash.update(String(reportId) + ':' + JSON.stringify(recognitionResults));
    return hash.digest('hex');
}

function signBody(rawBody, timestamp) {
    return crypto
        .createHmac('sha256', ERP_PUSH_SECRET)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
}

// Defensive, date-only future-period check (spec §8) — a same-day period at
// a later time slot isn't caught here (timeSlot formats vary too much across
// the app to parse reliably), but ERP performs the authoritative check
// server-side regardless.
function isFuturePeriod(report) {
    const today = new Date().toISOString().slice(0, 10);
    return String(report.date) > today;
}

// Push one report's current finalReport to ERP. Always resolves (never
// throws) — failure is recorded on report.erpPush, not surfaced as an
// exception, so callers (the scheduler, the retry job) never need a
// try/catch of their own around this.
async function pushAttendanceToErp(report, { bypassCap = false } = {}) {
    if (!erpPushConfigured()) {
        console.log('[ErpPush] ERP_ATTENDANCE_PUSH_URL/ERP_PUSH_SECRET not configured — skipping push.');
        return { skipped: true, reason: 'not_configured' };
    }

    const settings = await ErpPushSettings.getSettings();
    if (!settings.enabled) {
        return { skipped: true, reason: 'disabled' };
    }

    // Whichever side reached finality first is authoritative — no further
    // pushes once acked or faculty-finalised (spec §7, §10).
    if (report.erpLockState && report.erpLockState !== 'none') {
        return { skipped: true, reason: report.erpLockState };
    }

    const maxAttempts = settings.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    if (!bypassCap && (report.erpPush?.attempts || 0) >= maxAttempts) {
        return { skipped: true, reason: 'attempts_exhausted' };
    }

    if (isFuturePeriod(report)) {
        return { skipped: true, reason: 'future_period' };
    }

    const recognitionResults = buildRecognitionResults(report);
    const idempotencyKey = computeIdempotencyKey(report._id, recognitionResults);

    const payload = {
        periodId: report.periodId,
        classId: buildClassId(report),
        sessionDate: report.date,
        xceedTimestamp: report.xceedTimestamp.toISOString(),
        recognitionResults,
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
            validateStatus: () => true, // handle 4xx/409 branching ourselves
        });

        const responseCode = res.data?.responseCode || null;
        const flags = Array.isArray(res.data?.flags) ? res.data.flags : [];

        const baseErpPush = {
            attempts,
            lastAttemptAt: now,
            lastResponse: res.data ?? null,
            lastResponseCode: res.status,
            responseCode,
            flags,
            idempotencyKey,
        };

        // ── Success cases ────────────────────────────────────────────────
        if (responseCode === 'ATTENDANCE_ACCEPTED' || responseCode === 'ATTENDANCE_ACCEPTED_WITH_FLAGS') {
            report.erpPush = { ...baseErpPush, status: 'sent', sentAt: now, lastError: null };
            report.erpLockState = 'posted_acked';
            await report.save();
            console.log(`[ErpPush] ${report.periodId} — ${responseCode} (${recognitionResults.length} students).`);
            return { ok: true, responseCode };
        }

        // Duplicate/retry racing an earlier success — treat as success, no-op.
        if (responseCode === 'PERIOD_ALREADY_POSTED') {
            report.erpPush = { ...baseErpPush, status: 'sent', sentAt: report.erpPush?.sentAt || now, lastError: null };
            report.erpLockState = 'posted_acked';
            await report.save();
            return { ok: true, responseCode, skipped: true, reason: 'already_posted' };
        }

        // ── Permanent failures — never retried ──────────────────────────
        if (responseCode === 'PERIOD_ALREADY_FINALIZED') {
            report.erpPush = { ...baseErpPush, status: 'failed', sentAt: report.erpPush?.sentAt || null, lastError: res.data?.message || 'Faculty already finalised this period in ERP' };
            report.erpLockState = 'faculty_finalized';
            await report.save();
            return { ok: false, responseCode, permanent: true };
        }
        if (responseCode === 'FUTURE_PERIOD_REJECTED' || responseCode === 'INVALID_PAYLOAD') {
            // Pin attempts at the configured cap so the fast sweep (which
            // filters on attempts < maxAttempts) never picks this back up —
            // erpLockState doesn't fit here (this isn't about who "won" the
            // period), so the attempt count is what actually stops retries.
            // The nightly retry / manual Sync bypass this cap regardless.
            report.erpPush = { ...baseErpPush, status: 'failed', attempts: maxAttempts, sentAt: report.erpPush?.sentAt || null, lastError: res.data?.message || responseCode };
            await report.save();
            return { ok: false, responseCode, permanent: true };
        }

        // ── Unrecognised response — transient failure, eligible for retry ──
        throw new Error(`ERP responded ${res.status}${responseCode ? ` (${responseCode})` : ''}: ${JSON.stringify(res.data).slice(0, 500)}`);
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
            lastResponseCode: err.response?.status ?? null,
            responseCode: err.response?.data?.responseCode || null,
            flags: report.erpPush?.flags || [],
            idempotencyKey,
        };
        await report.save();
        console.warn(`[ErpPush] ${report.periodId} — failed (attempt ${attempts}): ${errMessage}`);
        return { ok: false, error: errMessage };
    }
}

// Fast sweep — ticks every minute; for each still-pending/failed, unlocked
// report under the configured attempt cap, only actually retries once at
// least retryIntervalMinutes have passed since its last attempt. Reading the
// interval from settings on every tick (rather than baking it into the cron
// schedule) means an admin's interval change via the Retry Policy card takes
// effect on the very next tick, with no server restart.
async function retryFailedPushes() {
    if (!erpPushConfigured()) return;
    const settings = await ErpPushSettings.getSettings();
    if (!settings.enabled) return;

    const maxAttempts = settings.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const intervalMs = (settings.retryIntervalMinutes ?? DEFAULT_RETRY_INTERVAL_MINUTES) * 60 * 1000;

    const candidates = await AttendanceReport.find({
        'erpPush.status': { $in: ['pending', 'failed'] },
        'erpPush.attempts': { $lt: maxAttempts },
        erpLockState: 'none',
    });

    const now = Date.now();
    const due = candidates.filter((r) => {
        if (!r.erpPush?.lastAttemptAt) return true; // never attempted yet
        return now - new Date(r.erpPush.lastAttemptAt).getTime() >= intervalMs;
    });

    if (!due.length) return;
    console.log(`[ErpPush] Fast sweep — ${due.length} report(s) due.`);
    for (const report of due) {
        await pushAttendanceToErp(report);
    }
}

function startErpPushRetryScheduler() {
    cron.schedule(FAST_SWEEP_CRON, () => {
        retryFailedPushes().catch((err) =>
            console.error('[ErpPush] Fast sweep error:', err.message));
    });
    console.log('[ErpPush] Fast sweep scheduler registered — ticks every minute; interval/cap read from settings.');
}

// Push every currently unsynced (pending/failed, unlocked) report right now,
// bypassing the attempt cap — backs the "Sync all" button and the nightly
// evening retry.
async function syncAllPending() {
    const candidates = await AttendanceReport.find({
        'erpPush.status': { $in: ['pending', 'failed'] },
        erpLockState: 'none',
    });

    const results = { total: candidates.length, sent: 0, failed: 0, skipped: 0 };
    for (const report of candidates) {
        const result = await pushAttendanceToErp(report, { bypassCap: true });
        if (result.ok) results.sent += 1;
        else if (result.skipped) results.skipped += 1;
        else results.failed += 1;
    }
    return results;
}

// Independent evening pass — retries every still-failed/pending unlocked
// period regardless of how many attempts the fast sweep already burned
// through. Gated by ErpPushSettings.nightlyRetryEnabled (Retry Policy card).
async function runNightlyErpAttendanceRetry() {
    if (!erpPushConfigured()) return { skipped: true, reason: 'not_configured' };
    const settings = await ErpPushSettings.getSettings();
    if (!settings.enabled) return { skipped: true, reason: 'disabled' };
    if (!settings.nightlyRetryEnabled) return { skipped: true, reason: 'nightly_disabled' };
    const result = await syncAllPending();
    console.log(`[ErpPush] Nightly retry — ${result.sent}/${result.total} sent, ${result.failed} failed, ${result.skipped} skipped.`);
    return result;
}

function startErpNightlyRetryScheduler() {
    cron.schedule(NIGHTLY_RETRY_CRON, () => {
        runNightlyErpAttendanceRetry().catch((err) =>
            console.error('[ErpPush] Nightly retry error:', err.message));
    });
    console.log(`[ErpPush] Nightly retry scheduler registered — ${NIGHTLY_RETRY_CRON}, toggle via settings.nightlyRetryEnabled.`);
}

// ── Express handlers ─────────────────────────────────────────────────────────

// GET /erp-push/settings
async function getSettings(req, res) {
    try {
        const settings = await ErpPushSettings.getSettings();
        res.json({
            enabled: settings.enabled,
            configured: erpPushConfigured(),
            maxAttempts: settings.maxAttempts,
            retryIntervalMinutes: settings.retryIntervalMinutes,
            nightlyRetryEnabled: settings.nightlyRetryEnabled,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// PATCH /erp-push/settings  { enabled?, maxAttempts?, retryIntervalMinutes?, nightlyRetryEnabled? }
// Every field is optional — only the fields present are updated. All four
// are surfaced editable on the ERP Controls page's Retry Policy card.
async function updateSettings(req, res) {
    try {
        const { enabled, maxAttempts, retryIntervalMinutes, nightlyRetryEnabled } = req.body;
        if (enabled === undefined && maxAttempts === undefined
            && retryIntervalMinutes === undefined && nightlyRetryEnabled === undefined) {
            return res.status(400).json({ error: 'At least one of enabled, maxAttempts, retryIntervalMinutes, nightlyRetryEnabled is required.' });
        }
        if (enabled !== undefined && typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled must be a boolean.' });
        }
        if (maxAttempts !== undefined && (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20)) {
            return res.status(400).json({ error: 'maxAttempts must be an integer between 1 and 20.' });
        }
        if (retryIntervalMinutes !== undefined && (!Number.isInteger(retryIntervalMinutes) || retryIntervalMinutes < 1 || retryIntervalMinutes > 1440)) {
            return res.status(400).json({ error: 'retryIntervalMinutes must be an integer between 1 and 1440.' });
        }
        if (nightlyRetryEnabled !== undefined && typeof nightlyRetryEnabled !== 'boolean') {
            return res.status(400).json({ error: 'nightlyRetryEnabled must be a boolean.' });
        }

        const settings = await ErpPushSettings.getSettings();
        if (enabled !== undefined) settings.enabled = enabled;
        if (maxAttempts !== undefined) settings.maxAttempts = maxAttempts;
        if (retryIntervalMinutes !== undefined) settings.retryIntervalMinutes = retryIntervalMinutes;
        if (nightlyRetryEnabled !== undefined) settings.nightlyRetryEnabled = nightlyRetryEnabled;
        await settings.save();
        res.json({
            enabled: settings.enabled,
            maxAttempts: settings.maxAttempts,
            retryIntervalMinutes: settings.retryIntervalMinutes,
            nightlyRetryEnabled: settings.nightlyRetryEnabled,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// GET /erp-push/status?status=&department=&from=&to=&limit=&skip=
// Dept-scoped users (not iams-admin/admin) are always restricted to their
// own department; full-access users may filter with ?department= and get a
// `departments` list for the dropdown — same pattern as listOverriddenAttendance.
// from/to filter on the report's `date` (YYYY-MM-DD), both inclusive.
async function getPushStatus(req, res) {
    try {
        const { status, department, from, to, limit = 100, skip = 0 } = req.query;
        const filter = {};
        if (status) filter['erpPush.status'] = status;
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = from;
            if (to) filter.date.$lte = to;
        }

        const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const deptRegex = (value) => {
            const norm = escapeRegex(String(value).trim().replace(/\s+/g, '_'));
            return new RegExp(`^${norm.replace(/_/g, '[ _]')}$`, 'i');
        };
        if (!req.attendanceFullAccess) {
            filter.department = deptRegex(req.attendanceDepartment);
        } else if (department) {
            filter.department = deptRegex(department);
        }

        const reports = await AttendanceReport.find(filter)
            .select('batch department semester subject faculty room date timeSlot periodId erpLockState facultyLockedAt summary erpPush')
            .sort({ date: -1, createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));

        const total = await AttendanceReport.countDocuments(filter);

        // Department dropdown options — full-access users only
        let departments;
        if (req.attendanceFullAccess) {
            departments = (await AttendanceReport.distinct('department'))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
        }

        res.json({
            configured: erpPushConfigured(),
            items: reports.map((r) => ({
                reportId: r._id,
                periodId: r.periodId,
                batch: r.batch,
                department: r.department,
                semester: r.semester,
                subject: r.subject,
                faculty: r.faculty,
                room: r.room,
                date: r.date,
                timeSlot: r.timeSlot,
                erpLockState: r.erpLockState,
                facultyLockedAt: r.facultyLockedAt,
                summary: { present: r.summary?.present || 0, absent: r.summary?.absent || 0 },
                erpPush: r.erpPush,
            })),
            total,
            skip: Number(skip),
            limit: Number(limit),
            ...(departments ? { departments } : {}),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /erp-push/:reportId/retry — manual "Sync now", bypasses the attempt cap.
async function retryOne(req, res) {
    try {
        const report = await AttendanceReport.findById(req.params.reportId);
        if (!report) return res.status(404).json({ error: 'Report not found' });
        const result = await pushAttendanceToErp(report, { bypassCap: true });
        res.json({ result, erpPush: report.erpPush, erpLockState: report.erpLockState });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /erp-push/sync-all — "Sync all" button: pushes every unsynced,
// unlocked report right now, bypassing the attempt cap.
async function syncAll(req, res) {
    try {
        const result = await syncAllPending();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    erpPushConfigured,
    pushAttendanceToErp,
    retryFailedPushes,
    syncAllPending,
    runNightlyErpAttendanceRetry,
    startErpPushRetryScheduler,
    startErpNightlyRetryScheduler,
    getSettings,
    updateSettings,
    getPushStatus,
    retryOne,
    syncAll,
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_RETRY_INTERVAL_MINUTES,
};

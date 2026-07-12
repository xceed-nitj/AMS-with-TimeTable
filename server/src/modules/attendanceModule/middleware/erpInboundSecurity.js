// server/src/modules/attendanceModule/middleware/erpInboundSecurity.js
//
// Security controls for HTTP calls ERP makes INTO us (currently just the
// faculty-override-sync callback) — XCEED–ERP Attendance Integration spec
// §15. IP allowlisting is meant to sit at the network/firewall layer in
// production; the checks here are defence in depth, not a substitute for it.
//
// ── Configuration (env) ──────────────────────────────────────────────────────
//   ERP_INBOUND_SECRET           required to accept any inbound call — shared
//                                 secret used to verify X-Signature. Falls
//                                 back to ERP_PUSH_SECRET if unset.
//   ERP_INBOUND_SECRET_PREVIOUS  optional — a second, still-accepted secret
//                                 so rotation doesn't require a hard cutover.
//   ERP_INBOUND_IP_ALLOWLIST     optional, comma-separated IPs. Empty/unset
//                                 = no IP check performed here (rely on the
//                                 firewall layer instead).

const crypto = require('crypto');

// Read at request time (not captured into a module-load-time const) so a
// secret rotation or allowlist change via env takes effect without a
// process restart, and so tests can toggle these per-case.
function inboundSecret() {
    return process.env.ERP_INBOUND_SECRET || process.env.ERP_PUSH_SECRET || '';
}
function inboundSecretPrevious() {
    return process.env.ERP_INBOUND_SECRET_PREVIOUS || '';
}
function ipAllowlistEntries() {
    return (process.env.ERP_INBOUND_IP_ALLOWLIST || '')
        .split(',').map((ip) => ip.trim()).filter(Boolean);
}

function timingSafeStringEqual(a, b) {
    const bufA = Buffer.from(String(a || ''));
    const bufB = Buffer.from(String(b || ''));
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function sign(secret, timestamp, rawBody) {
    return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

// Missing/invalid signature maps to 400 INVALID_PAYLOAD per spec §13.2's own
// table ("missing facultyLockedAt, missing signature, or malformed ... array").
function verifyErpSignature(req, res, next) {
    const secret = inboundSecret();
    if (!secret) {
        return res.status(503).json({ status: 'FAILURE', responseCode: 'NOT_CONFIGURED', message: 'ERP_INBOUND_SECRET is not configured on the server.' });
    }
    const timestamp = req.get('X-Timestamp');
    const signature  = req.get('X-Signature');
    if (!timestamp || !signature || !req.rawBody) {
        return res.status(400).json({ status: 'FAILURE', responseCode: 'INVALID_PAYLOAD', message: 'Missing X-Timestamp/X-Signature header.' });
    }

    const rawBody = req.rawBody.toString('utf8');
    const candidates = [secret, inboundSecretPrevious()].filter(Boolean);
    const valid = candidates.some((s) => timingSafeStringEqual(sign(s, timestamp, rawBody), signature));
    if (!valid) {
        return res.status(400).json({ status: 'FAILURE', responseCode: 'INVALID_PAYLOAD', message: 'Signature verification failed.' });
    }
    next();
}

function ipAllowlist(req, res, next) {
    const allowlist = ipAllowlistEntries();
    if (allowlist.length === 0) return next(); // enforced at firewall layer instead
    const ip = String(req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
    if (!allowlist.includes(ip)) {
        return res.status(403).json({ status: 'FAILURE', responseCode: 'IP_NOT_ALLOWED', message: 'Source IP is not allowlisted.' });
    }
    next();
}

// Lightweight in-memory sliding-window limiter — fine for a single-process
// deployment; a multi-instance deployment should move this to a shared store.
function makeRateLimiter({ windowMs, max, keyFn }) {
    const hits = new Map(); // key -> timestamps[]
    return (req, res, next) => {
        const key = keyFn(req);
        const now = Date.now();
        const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
        if (arr.length >= max) {
            return res.status(429).json({ status: 'FAILURE', responseCode: 'RATE_LIMITED', message: 'Too many requests.' });
        }
        arr.push(now);
        hits.set(key, arr);
        next();
    };
}

// General per-IP limit calibrated to realistic posting frequency + retry
// burst; a stricter per-periodId limit catches retry-storm bugs, since
// legitimate traffic for one period is at most a handful of calls.
const rateLimitByIp = makeRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    keyFn: (req) => String(req.ip || req.socket?.remoteAddress || 'unknown'),
});
const rateLimitByPeriod = makeRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    keyFn: (req) => String(req.body?.periodId || 'unknown'),
});

module.exports = {
    verifyErpSignature,
    ipAllowlist,
    rateLimitByIp,
    rateLimitByPeriod,
};

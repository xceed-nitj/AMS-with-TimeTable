// server/src/modules/attendanceModule/routes/erpInboundRoutes.js
//
// Routes ERP calls directly (not a logged-in browser session) — protected by
// HMAC signature + optional IP allowlist + rate limiting instead of the
// cookie-based role check. See middleware/erpInboundSecurity.js and
// controllers/erpOverrideSyncController.js.

const express = require('express');
const router  = express.Router();
const { verifyErpSignature, ipAllowlist, rateLimitByIp, rateLimitByPeriod } = require('../middleware/erpInboundSecurity');
const { facultyOverrideSync } = require('../controllers/erpOverrideSyncController');

router.post(
    '/faculty-override-sync',
    ipAllowlist,
    rateLimitByIp,
    verifyErpSignature,
    rateLimitByPeriod,
    async (req, res) => {
        try {
            await facultyOverrideSync(req, res);
        } catch (e) {
            res.status(500).json({ status: 'FAILURE', message: e.message });
        }
    },
);

module.exports = router;

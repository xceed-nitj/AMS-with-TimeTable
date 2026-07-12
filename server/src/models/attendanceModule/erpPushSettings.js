// server/src/models/attendanceModule/erpPushSettings.js
// Admin-configurable settings for the outbound push of finalReport (roll no
// + finalStatus) to the external ERP's attendance-posting endpoint — see
// erpAttendancePushController.js. Singleton-via-findOne({}) pattern, same as
// ErpSyncSettings.getSettings(). All fields here are editable from the ERP
// Controls page's Retry Policy card (GET/PATCH /erp-push/settings) — none of
// them are hardcoded constants in the controller anymore.

const mongoose = require('mongoose');

const erpPushSettingsSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    // At most this many total attempts (initial push + auto-retries) before
    // the fast sweep gives up on a period — "Sync now"/"Sync all"/the nightly
    // evening retry all bypass this cap.
    maxAttempts: { type: Number, default: 2, min: 1, max: 20 },
    // Minimum minutes between automatic retry attempts for the same report —
    // checked per-report against erpPush.lastAttemptAt by the fast sweep
    // (which itself ticks every minute; this is the actual backoff window).
    retryIntervalMinutes: { type: Number, default: 3, min: 1, max: 1440 },
    // A second, independent pass late in the day that retries every still-
    // failed/pending unlocked period, bypassing maxAttempts entirely — a
    // safety net beyond the fast sweep's cap. On/off only; the time of day
    // is fixed server-side (NIGHTLY_RETRY_CRON in erpAttendancePushController.js).
    nightlyRetryEnabled: { type: Boolean, default: true },
}, { timestamps: true });

erpPushSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({});
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('ErpPushSettings', erpPushSettingsSchema);

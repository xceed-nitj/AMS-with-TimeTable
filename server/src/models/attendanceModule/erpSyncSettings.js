// server/src/models/attendanceModule/erpSyncSettings.js
// Single global on/off switch for the nightly ERP auto-sync scheduler
// (erpAutoSyncScheduler.js) — replaces the ERP_AUTO_SYNC_ENABLED env var so
// an admin can toggle it from the ERP Sync page without a server restart.
// Singleton-via-findOne({}) pattern, same as NotificationSettings.getSettings()
// (no "profileName" key needed — ERP only ever has one global config).

const mongoose = require('mongoose');

const erpSyncSettingsSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
}, { timestamps: true });

erpSyncSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({});
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('ErpSyncSettings', erpSyncSettingsSchema);

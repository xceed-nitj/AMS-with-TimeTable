// server/src/models/attendanceModule/erpPushSettings.js
// Single global on/off switch for pushing finalReport (roll no + finalStatus)
// to the external ERP's attendance-posting endpoint after every completed
// run — see erpAttendancePushController.js. Singleton-via-findOne({})
// pattern, same as ErpSyncSettings.getSettings().

const mongoose = require('mongoose');

const erpPushSettingsSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
}, { timestamps: true });

erpPushSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({});
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('ErpPushSettings', erpPushSettingsSchema);

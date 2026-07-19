// server/src/models/attendanceModule/otherControlsSettings.js
//
// "Other Controls" — miscellaneous admin toggles surfaced in the settings
// screen (editSessionDates.jsx). Singleton settings document, same pattern
// as frameCleanupSettings.js / notificationSettings.js.
//
// Currently holds two time-window restrictions:
//   • groundTruthTimeWindowEnabled   — restrict Ground Truth acquisition
//   • attendanceRunTimeWindowEnabled — restrict Attendance runs
//
// Both default to FALSE so shipping this feature changes NO existing
// behaviour. Turning a toggle ON (from the admin dashboard) enforces the
// 08:30–17:30 IST window on the corresponding action. This lets the window
// be switched on only once we're ready in production.

const mongoose = require("mongoose");

const otherControlsSettingsSchema = new mongoose.Schema(
  {
    // Restrict Ground Truth acquisition (RTSP extraction) to the window below.
    // Default OFF = acquisition allowed at any time (existing behaviour).
    groundTruthTimeWindowEnabled: { type: Boolean, default: false },

    // Restrict Attendance runs (auto scheduler + manual triggers) to the
    // window below. Default OFF = runs allowed at any time (existing behaviour).
    attendanceRunTimeWindowEnabled: { type: Boolean, default: false },

    // Allowed window, IST ("HH:mm"). Stored as fields for flexibility; the
    // UI currently shows them read-only. 08:30–17:30 per the requirement.
    windowStart: { type: String, default: "08:30" },
    windowEnd: { type: String, default: "17:30" },
  },
  { timestamps: true }
);

otherControlsSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const OtherControlsSettings = mongoose.model(
  "OtherControlsSettings",
  otherControlsSettingsSchema
);
module.exports = OtherControlsSettings;

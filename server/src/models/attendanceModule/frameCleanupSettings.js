// server/src/models/attendanceModule/frameCleanupSettings.js
//
// Issue #1544 follow-up — on/off toggle for the automatic weekly frame
// cleanup job (frameCleanupScheduler.js). Singleton settings document,
// same pattern as notificationSettings.js.

const mongoose = require("mongoose");

const frameCleanupSettingsSchema = new mongoose.Schema(
  {
    // Defaults to true so flipping this feature in doesn't silently change
    // the already-live production behaviour (the cron job has been running
    // unconditionally since it was first shipped) — this only adds the
    // ability to turn it OFF, not a new default-off state.
    enabled: { type: Boolean, default: true },

    // Bookkeeping for the settings UI — populated by the scheduler after
    // each run so an admin can see when cleanup last ran without digging
    // through server logs.
    lastRunAt: { type: Date, default: null },
    lastRunStats: {
      oldFolders: { type: Number, default: 0 },
      rawDeleted: { type: Number, default: 0 },
      annotatedKept: { type: Number, default: 0 },
      annotatedDeleted: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

frameCleanupSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({ enabled: true });
  }
  return settings;
};

const FrameCleanupSettings = mongoose.model(
  "FrameCleanupSettings",
  frameCleanupSettingsSchema
);
module.exports = FrameCleanupSettings;

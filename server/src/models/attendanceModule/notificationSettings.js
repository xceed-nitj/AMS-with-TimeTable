const mongoose = require("mongoose");

// Controls what each role receives — 3 fixed roles, always present
const roleSettingsSchema = new mongoose.Schema({
  role: { type: String, enum: ["admin", "coordinator", "head"], required: true },
  alertTypes: {
    serverDown:          { type: Boolean, default: false },
    lowConfidence:       { type: Boolean, default: false },
    noReportSaved:       { type: Boolean, default: false },
    classBunk:           { type: Boolean, default: false },
    duplicateAttendance: { type: Boolean, default: false },
    dailySummary:        { type: Boolean, default: false },
  },
}, { _id: false });

// Just email + role + dept — no alertTypes here
const recipientSchema = new mongoose.Schema({
  email:    { type: String, required: true, trim: true },
  role:     { type: String, enum: ["admin", "coordinator", "head"], required: true },
  dept:     { type: String, trim: true, default: "" },
}, { _id: true });

// Controls when/what the daily-or-weekly HOD attendance summary sends —
// distinct from alertTypes.dailySummary above (which controls WHO receives
// it, per role, same as the other 5 alert types).
const dailySummaryConfigSchema = new mongoose.Schema({
  enabled:   { type: Boolean, default: false },
  frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
  mode:      { type: String, enum: ["all", "threshold"], default: "all" },
  threshold: { type: Number, default: 75 }, // percent; only used when mode === "threshold"
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
  enabled:            { type: Boolean, default: false },
  roles:              { type: [roleSettingsSchema], default: [] },
  recipients:         { type: [recipientSchema], default: [] },
  dailySummaryConfig: { type: dailySummaryConfigSchema, default: () => ({}) },
}, { timestamps: true });

const DEFAULT_ALERT_TYPES = { serverDown: false, lowConfidence: false, noReportSaved: false, classBunk: false, duplicateAttendance: false, dailySummary: false };

const DEFAULT_ROLES = [
  { role: "admin",       alertTypes: { ...DEFAULT_ALERT_TYPES } },
  { role: "coordinator", alertTypes: { ...DEFAULT_ALERT_TYPES } },
  { role: "head",        alertTypes: { ...DEFAULT_ALERT_TYPES } },
];

notificationSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({ enabled: false, roles: DEFAULT_ROLES, recipients: [] });
  }
  // Ensure all 3 roles always exist (migration safety)
  for (const def of DEFAULT_ROLES) {
    if (!settings.roles.find((r) => r.role === def.role)) {
      settings.roles.push(def);
    }
  }
  // Migration safety for docs created before dailySummaryConfig existed
  if (!settings.dailySummaryConfig) {
    settings.dailySummaryConfig = { enabled: false, frequency: "daily", mode: "all", threshold: 75 };
  }
  return settings;
};

const NotificationSettings = mongoose.model("NotificationSettings", notificationSettingsSchema);
module.exports = NotificationSettings;

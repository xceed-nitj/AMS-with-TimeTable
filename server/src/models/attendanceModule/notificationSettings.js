const mongoose = require("mongoose");

// Controls what each role receives — 3 fixed roles, always present
const roleSettingsSchema = new mongoose.Schema({
  role: { type: String, enum: ["admin", "coordinator", "head"], required: true },
  alertTypes: {
    serverDown:          { type: Boolean, default: false },
    lowConfidence:       { type: Boolean, default: false },
    classBunk:           { type: Boolean, default: false },
    duplicateAttendance: { type: Boolean, default: false },
  },
}, { _id: false });

// Just email + role + dept — no alertTypes here
const recipientSchema = new mongoose.Schema({
  email:    { type: String, required: true, trim: true },
  role:     { type: String, enum: ["admin", "coordinator", "head"], required: true },
  dept:     { type: String, trim: true, default: "" },
}, { _id: true });

const notificationSettingsSchema = new mongoose.Schema({
  enabled:    { type: Boolean, default: false },
  roles:      { type: [roleSettingsSchema], default: [] },
  recipients: { type: [recipientSchema], default: [] },
}, { timestamps: true });

const DEFAULT_ROLES = [
  { role: "admin",       alertTypes: { serverDown: false, lowConfidence: false, classBunk: false, duplicateAttendance: false } },
  { role: "coordinator", alertTypes: { serverDown: false, lowConfidence: false, classBunk: false, duplicateAttendance: false } },
  { role: "head",        alertTypes: { serverDown: false, lowConfidence: false, classBunk: false, duplicateAttendance: false } },
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
  return settings;
};

const NotificationSettings = mongoose.model("NotificationSettings", notificationSettingsSchema);
module.exports = NotificationSettings;

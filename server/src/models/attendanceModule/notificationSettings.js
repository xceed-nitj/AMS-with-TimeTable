const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true },
  category: { type: String, enum: ["admin", "coordinator", "head"], required: true },
  dept: { type: String, trim: true, default: "" },
  alertTypes: {
    serverDown: { type: Boolean, default: false },
    lowConfidence: { type: Boolean, default: false },
    classBunk: { type: Boolean, default: false },
    duplicateAttendance: { type: Boolean, default: false },
  },
}, { _id: true });

const notificationSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  recipients: { type: [recipientSchema], default: [] },
}, { timestamps: true });

notificationSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({ enabled: false, recipients: [] });
  }
  return settings;
};

const NotificationSettings = mongoose.model("NotificationSettings", notificationSettingsSchema);
module.exports = NotificationSettings;

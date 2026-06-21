const NotificationSettings = require('../../../models/attendanceModule/notificationSettings');

const ALERT_KEYS = ['serverDown', 'lowConfidence', 'classBunk', 'duplicateAttendance'];

function normalizeAlertTypes(input = {}) {
  const result = {};
  for (const key of ALERT_KEYS) {
    result[key] = !!input[key];
  }
  return result;
}

class NotificationSettingsController {
  async getSettings(req, res) {
    try {
      const settings = await NotificationSettings.getSettings();
      res.json({ settings });
    } catch (error) {
      console.error('[NotificationSettingsController] getSettings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSettings(req, res) {
    try {
      const { enabled } = req.body;
      const settings = await NotificationSettings.getSettings();
      if (typeof enabled === "boolean") settings.enabled = enabled;
      await settings.save();
      res.json({ message: "Settings updated", settings });
    } catch (error) {
      console.error('[NotificationSettingsController] updateSettings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addRecipient(req, res) {
    try {
      const { email, category, dept, alertTypes } = req.body;
      if (!email || !category) return res.status(400).json({ error: 'email and category required' });
      if ((category === 'coordinator' || category === 'head') && !dept) {
        return res.status(400).json({ error: 'dept required for coordinator/head' });
      }
      const settings = await NotificationSettings.getSettings();
      const exists = settings.recipients.some(r => r.email === email && r.category === category && r.dept === (dept || ""));
      if (exists) return res.status(409).json({ error: 'Recipient already exists' });
      settings.recipients.push({
        email,
        category,
        dept: dept || "",
        alertTypes: normalizeAlertTypes(alertTypes),
      });
      await settings.save();
      res.json({ message: 'Recipient added', settings });
    } catch (error) {
      console.error('[NotificationSettingsController] addRecipient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateRecipient(req, res) {
    try {
      const { id } = req.params;
      const { alertTypes } = req.body;
      const settings = await NotificationSettings.getSettings();
      const recipient = settings.recipients.find(r => r._id.toString() === id);
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
      recipient.alertTypes = normalizeAlertTypes(alertTypes);
      await settings.save();
      res.json({ message: 'Recipient updated', settings });
    } catch (error) {
      console.error('[NotificationSettingsController] updateRecipient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeRecipient(req, res) {
    try {
      const { id } = req.params;
      const settings = await NotificationSettings.getSettings();
      settings.recipients = settings.recipients.filter(r => r._id.toString() !== id);
      await settings.save();
      res.json({ message: 'Recipient removed', settings });
    } catch (error) {
      console.error('[NotificationSettingsController] removeRecipient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = NotificationSettingsController;

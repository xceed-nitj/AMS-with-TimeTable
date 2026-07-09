// server/src/modules/attendanceModule/controllers/frameCleanupSettingsController.js
const FrameCleanupSettings = require('../../../models/attendanceModule/frameCleanupSettings');
const { runFrameCleanupNow } = require('./frameCleanupScheduler');

class FrameCleanupSettingsController {
  async getSettings(req, res) {
    try {
      const settings = await FrameCleanupSettings.getSettings();
      res.json({ settings });
    } catch (error) {
      console.error('[FrameCleanupSettings] getSettings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateEnabled(req, res) {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
      }
      const settings = await FrameCleanupSettings.getSettings();
      settings.enabled = enabled;
      await settings.save();
      console.log(`[FrameCleanupSettings] enabled set to ${enabled} via settings UI`);
      res.json({ message: 'Updated', settings });
    } catch (error) {
      console.error('[FrameCleanupSettings] updateEnabled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Manual "run now" — deliberately bypasses the enabled flag (an explicit
  // admin action should always be allowed, e.g. for testing). runCleanup()
  // itself persists lastRunAt/lastRunStats, so we just return the result.
  async runNow(req, res) {
    try {
      const stats = await runFrameCleanupNow();
      const settings = await FrameCleanupSettings.getSettings();
      res.json({ message: 'Cleanup run complete', stats, settings });
    } catch (error) {
      console.error('[FrameCleanupSettings] runNow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = FrameCleanupSettingsController;

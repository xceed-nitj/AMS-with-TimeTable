// server/src/modules/attendanceModule/controllers/otherControlsSettingsController.js
const OtherControlsSettings = require('../../../models/attendanceModule/otherControlsSettings');

class OtherControlsSettingsController {
  async getSettings(req, res) {
    try {
      const settings = await OtherControlsSettings.getSettings();
      res.json({ settings });
    } catch (error) {
      console.error('[OtherControlsSettings] getSettings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSettings(req, res) {
    try {
      const { groundTruthTimeWindowEnabled, attendanceRunTimeWindowEnabled } = req.body;

      if (
        groundTruthTimeWindowEnabled !== undefined &&
        typeof groundTruthTimeWindowEnabled !== 'boolean'
      ) {
        return res.status(400).json({ error: 'groundTruthTimeWindowEnabled must be a boolean' });
      }
      if (
        attendanceRunTimeWindowEnabled !== undefined &&
        typeof attendanceRunTimeWindowEnabled !== 'boolean'
      ) {
        return res.status(400).json({ error: 'attendanceRunTimeWindowEnabled must be a boolean' });
      }

      const settings = await OtherControlsSettings.getSettings();
      if (groundTruthTimeWindowEnabled !== undefined) {
        settings.groundTruthTimeWindowEnabled = groundTruthTimeWindowEnabled;
      }
      if (attendanceRunTimeWindowEnabled !== undefined) {
        settings.attendanceRunTimeWindowEnabled = attendanceRunTimeWindowEnabled;
      }
      await settings.save();
      console.log(
        `[OtherControlsSettings] updated — GT window: ${settings.groundTruthTimeWindowEnabled}, ` +
          `attendance window: ${settings.attendanceRunTimeWindowEnabled}`
      );
      res.json({ message: 'Updated', settings });
    } catch (error) {
      console.error('[OtherControlsSettings] updateSettings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = OtherControlsSettingsController;

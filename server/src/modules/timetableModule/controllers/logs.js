const TimetableChangeLog = require("../../../models/timetableChangeLogs");

class LogsController {
  async getLogs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * parseInt(limit);
      const logs = await TimetableChangeLog.find()
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ time: -1 })
        .lean();

      // Dept and session are stored on the log document now
      res.json(logs);
    } catch (error) {
      console.error('Error in getLogs:', error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getTotalLogs(req, res) {
    try {
      const total = await TimetableChangeLog.countDocuments();
      res.json({ totalLogs: total });
    } catch (error) {
      console.error('Error in getTotalLogs:', error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteBySession(req, res) {
    try {
      const session = req.params.session;
      if (!session) return res.status(400).json({ error: 'Missing session parameter' });
      const result = await TimetableChangeLog.deleteMany({ session });
      res.json({ deletedCount: result.deletedCount });
    } catch (error) {
      console.error('Error deleting logs by session:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getLogsByDept(req, res) {
    try {
      const { dept } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * parseInt(limit);

      const logs = await TimetableChangeLog.find({ dept })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ time: -1 })
        .lean();

      res.json(logs);
    } catch (error) {
      console.error('Error fetching dept logs:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = LogsController;
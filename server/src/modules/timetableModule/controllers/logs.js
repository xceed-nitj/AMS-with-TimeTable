const TimetableChangeLog = require("../../../models/timetableChangeLogs");
const TimeTable = require("../../../models/timetable");

class LogsController {
  async getLogs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * parseInt(limit);
      const logs = await TimetableChangeLog.find()
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ time: -1 });

      // Fetch dept and session for each log
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const timetable = await TimeTable.findOne({ code: log.code }).select('dept session').lean();
          return {
            ...log.toObject(),
            dept: timetable ? timetable.dept : 'Unknown',
            session: timetable ? timetable.session : 'Unknown',
          };
        })
      );

      res.json(enrichedLogs);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getTotalLogs(req, res) {
    try {
      const total = await TimetableChangeLog.countDocuments();
      res.json({ totalLogs: total });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = LogsController;
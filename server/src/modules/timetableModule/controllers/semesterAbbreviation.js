const TimeTable = require("../../../models/timetable");
const HttpException = require("../../../models/http-exception");

class SemesterAbbreviationController {
  // Route 1: GET /semester/current
  async getCurrentSessionSemesters(req, res) {
    try {
      const result = await TimeTable.aggregate([
        { $match: { currentSession: true } },
        {
          $lookup: {
            from: "subjects", // Mongo collection name for the Subject model
            localField: "code",
            foreignField: "code",
            as: "subjects",
          },
        },
        { $unwind: "$subjects" },
        { $group: { _id: null, sems: { $addToSet: "$subjects.sem" } } },
      ]);

      const sems = (result[0]?.sems || []).sort((a, b) => a.localeCompare(b));

      res.status(200).json(sems);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }

  // Route 2: GET /semester/abbreviations/:sem
  async getAbbreviationsBySem(req, res) {
    try {
      const { sem } = req.params;
      if (!sem) throw new HttpException(400, "sem is required");

      const result = await TimeTable.aggregate([
        { $match: { currentSession: true } },
        {
          $lookup: {
            from: "subjects",
            let: { ttCode: "$code" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$code", "$$ttCode"] },
                      { $eq: ["$sem", sem] },
                    ],
                  },
                },
              },
            ],
            as: "subjects",
          },
        },
        { $unwind: "$subjects" },
        {
          $group: {
            _id: null,
            abbreviations: { $addToSet: "$subjects.subName" },
          },
        },
      ]);

      const abbreviations = result[0]?.abbreviations || [];
      res.status(200).json(abbreviations);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }

  // Route 3: GET /semester/bysession?session=2023-2024 (Even)
  async getSemestersBySession(req, res) {
    try {
      const { session } = req.query;
      if (!session) throw new HttpException(400, "session is required");

      const result = await TimeTable.aggregate([
        { $match: { session } },
        {
          $lookup: {
            from: "subjects",
            localField: "code",
            foreignField: "code",
            as: "subjects",
          },
        },
        { $unwind: "$subjects" },
        { $group: { _id: null, sems: { $addToSet: "$subjects.sem" } } },
      ]);

      const sems = (result[0]?.sems || []).sort((a, b) => a.localeCompare(b));
      res.status(200).json(sems);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }
}

module.exports = SemesterAbbreviationController;

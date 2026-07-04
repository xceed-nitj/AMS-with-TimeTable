const TimeTable = require("../../../models/timetable");
const HttpException = require("../../../models/http-exception");

const SUBJECT_PROJECTION = {
  subjectFullName: 1,
  subName: 1, // abbreviation
  subCode: 1,
  type: 1,
  sem: 1,
  degree: 1,
  dept: 1,
  credits: 1,
  studentCount: 1,
  code: 1,
  _id: 1,
};

class SemesterAbbreviationController {
  // Route 1: GET /semester/current
  async getCurrentSessionSemesters(req, res) {
    try {
      const result = await TimeTable.aggregate([
        { $match: { currentSession: true } },
        {
          $lookup: {
            from: "subjects",
            localField: "code",
            foreignField: "code",
            as: "subjects",
          },
        },
        { $unwind: "$subjects" },
        {
          $group: {
            _id: { dept: "$dept", sem: "$subjects.sem" },
          },
        },
        {
          $project: {
            _id: 0,
            dept: "$_id.dept",
            sem: "$_id.sem",
          },
        },
        { $sort: { dept: 1, sem: 1 } },
      ]);

      res.status(200).json(result);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }

  // Route 2: GET /semester/abbreviations/:sem
  // Returns full subject records (name, code, abbreviation, credits, etc.)
  // for a given sem, current session, all depts.
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
              { $project: SUBJECT_PROJECTION },
            ],
            as: "subjects",
          },
        },
        { $unwind: "$subjects" },
        { $replaceRoot: { newRoot: "$subjects" } },
      ]);

      res.status(200).json(result);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }

  // Route 3: GET /semester/bysession?session=<session>
  // Returns all distinct {dept, sem} pairs for any given session
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
        {
          $group: {
            _id: { dept: "$dept", sem: "$subjects.sem" },
          },
        },
        {
          $project: {
            _id: 0,
            dept: "$_id.dept",
            sem: "$_id.sem",
          },
        },
        { $sort: { dept: 1, sem: 1 } },
      ]);

      res.status(200).json(result);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }
}

module.exports = SemesterAbbreviationController;

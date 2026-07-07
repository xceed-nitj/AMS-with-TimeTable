// server/src/modules/attendanceModule/controllers/firstYearSubjectMappingController.js
//
// Maps each first-year (Basic Sciences) subject to the department that is
// actually "concerned" with it — i.e. the department eligible to allot
// faculty to teach it / whose students take it. This mirrors the pattern
// already used by the timetable module's first-year allotment screen,
// which filters subjects by a `dept` field — this controller is what lets
// an admin assign that `dept` per subject in the first place.
//
// NOTE: this file lives entirely inside attendanceModule and only reads
// the shared Subject/TimeTable models (server/src/models) — it does not
// touch anything inside modules/timetableModule.

const Subject = require("../../../models/subject");
const TimeTable = require("../../../models/timetable");

const BASIC_SCIENCES_DEPT = "Basic Sciences";

class FirstYearSubjectMappingController {
  // Resolve the first-year (Basic Sciences) timetable `code` for the same
  // session that `code` belongs to.
  async _getFirstYearCodeForSession(code) {
    const tt = await TimeTable.findOne({ code }).lean();
    if (!tt) return null;
    const firstYearTT = await TimeTable.findOne({
      dept: BASIC_SCIENCES_DEPT,
      session: tt.session,
    }).lean();
    return firstYearTT ? firstYearTT.code : null;
  }

  // GET /attendancemodule/firstyearsubjectmapping/subjects/:code
  // Returns every first-year subject for the session that `code` belongs
  // to, regardless of which department it is currently mapped to (or
  // unmapped) — so an admin can see and assign the concerned department
  // for each one.
  async listSubjects(req, res) {
    try {
      const { code } = req.params;
      const firstYearCode = await this._getFirstYearCodeForSession(code);
      if (!firstYearCode) {
        return res.status(404).json({ error: "No first-year (Basic Sciences) timetable found for this session." });
      }

      const subjects = await Subject.find({ code: firstYearCode })
        .sort({ sem: 1, subName: 1 })
        .lean();

      res.status(200).json(subjects);
    } catch (error) {
      console.error("[FirstYearSubjectMapping] listSubjects error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // PUT /attendancemodule/firstyearsubjectmapping/subjects/:id
  // Body: { dept }
  // Assigns/updates the concerned department for a single first-year subject.
  async mapSubjectToDept(req, res) {
    try {
      const { id } = req.params;
      const { dept } = req.body;
      if (!dept) {
        return res.status(400).json({ error: "dept is required" });
      }

      const updated = await Subject.findByIdAndUpdate(
        id,
        { dept },
        { new: true },
      );
      if (!updated) {
        return res.status(404).json({ error: "Subject not found" });
      }

      res.status(200).json(updated);
    } catch (error) {
      console.error("[FirstYearSubjectMapping] mapSubjectToDept error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }


  async listSubjectsBySession(req, res) {
    try {
      const { session } = req.params;

      // Direct single-step resolution of the Basic Sciences timetable metadata
      const firstYearTT = await TimeTable.findOne({
        dept: BASIC_SCIENCES_DEPT,
        session: session
      }).lean();

      if (!firstYearTT) {
        // Return a clean empty dataset if the session does not have a configuration yet
        return res.status(200).json([]);
      }

      // Immediately extract subjects linked directly to that functional tracking code
      const subjects = await Subject.find({ code: firstYearTT.code })
        .sort({ sem: 1, subName: 1 })
        .lean();

      res.status(200).json(subjects);
    } catch (error) {
      console.error("[FirstYearSubjectMapping] listSubjectsBySession error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}



module.exports = new FirstYearSubjectMappingController();

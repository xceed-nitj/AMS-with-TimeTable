const HttpException = require("../../../models/http-exception");
const MasterClassTable = require("../../../models/masterclasstable");
const ClassTable = require("../../../models/classtimetable");
const SubjectTable = require('../../../models/subject');
const SemTable = require("../../../models/mastersem");
const TimeTable = require("../../../models/timetable");
const Faculty = require("../../../models/faculty");


class MasterclasstableController {

  async createMasterTable(newData) {
    try {
      const { code } = newData;

      // Step 1: Delete all existing data related to the specified code
      await MasterClassTable.deleteMany({ code });

      // Step 2: Fetch data from 'class table' based on the code
      const classTableData = await ClassTable.find({ code });

      // If no data exists in the class table, handle gracefully
      if (!classTableData || classTableData.length === 0) {
        console.warn(`No class table data found for code: ${code}`);
        return { success: false, message: `No class table data found for code: ${code}` };
      }

      // Step 3: Process and insert new data
      for (const dataItem of classTableData) {
        const { day, slot, slotData, sem } = dataItem;

        // Fetch semDetails and codeDetails once for this iteration
        const semDetails = await SemTable.findOne({ sem });
        const codeDetails = await TimeTable.findOne({ code });

        for (const slotDataItem of slotData) {
          const { subject, faculty } = slotDataItem;
          const subDetails = await SubjectTable.findOne({ code, sem, subName: subject });
          const facultyDetails = await Faculty.findOne({ name: faculty });

          // Construct data object for insertion
          const newMasterData = {
            day,
            slot,
            sem,
            code,
            subject,
            faculty,
            room: slotDataItem.room,
            subjectCode: subDetails?.subCode ?? '',
            subjectFullName: subDetails?.subjectFullName ?? '',
            subjectType: subDetails?.type ?? '',
            subjectDept: codeDetails?.dept ?? '',
            degree: semDetails?.degree ?? '',
            subjectCredit: subDetails?.credits ?? '',
            offeringDept: facultyDetails?.dept ?? '',
            year: semDetails?.year ?? '',
            session: codeDetails?.session ?? '',
          };

          // Insert the new data into the MasterClassTable
          await MasterClassTable.create(newMasterData);
        }
      }

      // Return success
      console.log(`✅ Master table created successfully for code: ${code}`);
      return { success: true, message: 'Data replaced successfully!' };
      
    } catch (error) {
      console.error('Error in createMasterTable:', error);
      throw error; // Re-throw to be caught by caller
    }
  }

  async getMasterTable(req, res) {
    try {
      const semesterList = await MasterClassTable.find();
      res.json(semesterList);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMasterTableBySession(req, res) {
    const session = req.params.session;
    if (!session) {
      throw new HttpException(400, "Invalid Session");
    }
    try {
      const data = await MasterClassTable.find({ session });
      if (!data) throw new HttpException(400, "No semester data found in this department");
      res.json(data);
      return;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getMasterTableByDepartment(session, department) {
    if (!department) {
      throw new HttpException(400, "Invalid Department");
    }
    try {
      const data = await MasterClassTable.find({ offeringDept: department, session });
      if (!data) throw new HttpException(400, "No semester data found in this department");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = MasterclasstableController;
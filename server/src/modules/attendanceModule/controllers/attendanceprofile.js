const HttpException = require("../../../models/http-exception");
const Attendance = require("../../../models/attendance"); 

class AttendanceController {
  async createAttendance(req, res) {
    const newAttendance = req.body;
    console.log(newAttendance);
    try {
      const createdAttendance = await Attendance.create(newAttendance);
      res.json(createdAttendance);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAttendance(req, res) {
    try {
      const { subject } = req.query;
      let attendanceList;
  
      const filter = {};
  
      if (subject) {
        filter.subject = subject;
      }
  
      attendanceList = await Attendance.find(filter);
  
      res.json(attendanceList);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  
  async getAttendanceById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const attendance = await Attendance.findById(id);
      if (!attendance) throw new HttpException(400, "Attendance record does not exist");
      return attendance;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateAttendance(id, attendanceData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Attendance.findByIdAndUpdate(id, attendanceData);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteAttendance(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Attendance.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AttendanceController;
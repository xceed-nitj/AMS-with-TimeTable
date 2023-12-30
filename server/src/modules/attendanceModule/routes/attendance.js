const express = require("express");
const attendanceRouter = express.Router();
const AttendanceController = require("../controllers/attendanceprofile");
const attendanceController = new AttendanceController();

attendanceRouter.post("/", async (req, res) => {
  try {
    await attendanceController.createAttendance(req, res);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

attendanceRouter.get("/", async (req, res) => {
  try {
    await attendanceController.getAttendance(req, res);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

attendanceRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const attendance = await attendanceController.getAttendanceById(id);
    res.status(200).json(attendance);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

attendanceRouter.put('/:id', async (req, res) => {
  try {
    const attendanceId = req.params.id;
    const updatedData = req.body;
    await attendanceController.updateAttendance(attendanceId, updatedData);
    res.status(200).json({ response: "Attendance updated successfully" });
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

attendanceRouter.delete("/:id", async (req, res) => {
  try {
    const attendanceId = req.params.id;
    await attendanceController.deleteAttendance(attendanceId);
    res.status(200).json({ response: "Attendance deleted successfully" });
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = attendanceRouter;
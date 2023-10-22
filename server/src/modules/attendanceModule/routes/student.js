const express = require("express");
const studentRouter = express.Router();
const StudentController = require("../controllers/studentprofile");
const studentController = new StudentController();

studentRouter.post("/", async (req, res) => {
  try {
    await studentController.createStudent(req, res);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

studentRouter.get("/", async (req, res) => {
  try {
    await studentController.getStudents(req, res);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

studentRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const student = await studentController.getStudentById(id);
    res.status(200).json(student);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

studentRouter.put('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const updatedData = req.body;
    await studentController.updateId(studentId, updatedData);
    res.status(200).json({ response: "Student updated successfully" });
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

studentRouter.delete("/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    await studentController.deleteId(studentId);
    res.status(200).json({ response: "Student deleted successfully" });
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = studentRouter;
const HttpException = require("../../../models/http-exception");
const Student = require("../../../models/student");

class StudentController {
  async createStudent(req, res) {
    const newStudent = req.body;
    console.log(newStudent);
    try {
      const createdStudent = await Student.create(newStudent);
      res.json(createdStudent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getStudents(req, res) {
    try {
      const studentList = await Student.find();
      res.json(studentList);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getStudentById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const student = await Student.findById(id);
      if (!student) throw new HttpException(400, "Student does not exist");
      return student;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateId(id, studentData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Student.findByIdAndUpdate(id, studentData);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Student.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = StudentController;

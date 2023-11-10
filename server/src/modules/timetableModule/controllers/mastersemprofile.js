const HttpException = require("../../../models/http-exception");
const Mastersem = require("../../../models/mastersem");

class MastersemController {
  async createSemester(req, res) {
    const newSemester = req.body;
    try {
      const createdSemester = await Mastersem.create(newSemester);
      res.json(createdSemester);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getSemester(req, res) {
    try {
      const semesterList = await Mastersem.find();
      res.json(semesterList);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getSemesterById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await Mastersem.findById(id);
      if (!data) throw new HttpException(400, "Data does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getSemesterByDepartment(department) {
    if (!department) {
      throw new HttpException(400, "Invalid Department");
    }
    try {
      const data = await Mastersem.find({ dept: department });
      if (!data) throw new HttpException(400, "No semester data found in this department");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateSemester(id, updatedSemester) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Mastersem.findByIdAndUpdate(id, updatedSemester);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteSemester(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Mastersem.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getDepartments() {
    try {
      const uniqueDepartments = await Mastersem.distinct('dept');
      
      return uniqueDepartments;
    } catch (error) {
      throw error; 
    }
  }




}

module.exports = MastersemController;

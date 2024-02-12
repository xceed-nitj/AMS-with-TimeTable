const HttpException = require("../../../models/http-exception");
const Faculty = require("../../../models/faculty");
const addFaculty = require("../../../models/addfaculty");


class FacultyController {
    async createFaculty(req,res) {
        const newFaculty = req.body;
        try {
          const createdFaculty = await Faculty.create(newFaculty);
          res.json(createdFaculty)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getDepartments() {
        try {
          const uniqueDepartments = await Faculty.distinct('dept');
          
          return uniqueDepartments;
        } catch (error) {
          throw error; 
        }
      }
      
      async getFaculty(req, res) {
        try {
          const facultyList = await Faculty.find();
          const sortedFaculty = facultyList.sort((a, b) => (a.order ?? -Infinity) - (b.order ?? -Infinity));
          res.json(sortedFaculty);
          return;
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal server error" });
        }
      }
      
      
      async getFacultyById(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          const data = await Faculty.findById(id);
          if (!data) throw new HttpException(400, "data does not exists");
          return data;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async getFacultyByDepartment(department) {
        if (!department) {
          throw new HttpException(400, "Invalid Department");
        }
        try {
          const data = await Faculty.find({ dept: department }).sort({ order: 1 });
          if (!data) throw new HttpException(400, "No faculty members found in this department");
          return data;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
    
      async updateID(id, announcement) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await Faculty.findByIdAndUpdate(id, announcement);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await Faculty.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
    


    }


module.exports = FacultyController;

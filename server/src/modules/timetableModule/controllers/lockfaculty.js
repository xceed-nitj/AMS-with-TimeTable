const HttpException = require("../../../models/http-exception");
const lockFaculty = require("../../../models/lockfaculty");

class lockFacultyController {
    async lockFaculty(req,res) {
        const lockFacultydata = req.body;
        try {
          const lockedFaculty = await lockFaculty.create(lockFacultydata);
          res.json(lockedFaculty)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getlockFaculty(req, res) {
       try {
          const facultyList = await lockFaculty.find();
          res.json(facultyList)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

    //   async getFacultyById(id) {
    //     if (!id) {
    //       throw new HttpException(400, "Invalid Id");
    //     }
    //     try {
    //       const data = await lockFaculty.findById(id);
    //       if (!data) throw new HttpException(400, "data does not exists");
    //       return data;
    //     } catch (e) {
    //       throw new HttpException(500, e.message || "Internal Server Error");
    //     }
    //   }      

      async updateID(id, announcement) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await lockFaculty.findByIdAndUpdate(id, announcement);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await lockFaculty.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
    }

module.exports = lockFacultyController;

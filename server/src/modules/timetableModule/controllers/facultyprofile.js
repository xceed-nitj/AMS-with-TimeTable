const HttpException = require("../../../models/http-exception");
const Faculty = require("../../../models/faculty");


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

      async getFaculty(req, res) {
       try {
          const facultyList = await Faculty.find();
          res.json(facultyList)
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

      async updateID(id, announcement) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        // if (!isValidAnnouncement(announcement)) {
        //   return res.status(400).json({ error: "Invalid Announcement data" });
        // }
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


// function isValidAnnouncement(announcement) {
//   return (
//     announcement &&
//     typeof announcement === "object" &&
//     typeof announcement.Name === "string" &&
//     typeof announcement.Designation=== "string" &&
//     typeof announcement.Dept === "string" &&
//     typeof announcement.Type === "string" &&
//     typeof announcement.Email === "string" &&
//     typeof announcement.Extension === "string" &&
//     announcement.createdAt instanceof Date &&
//     announcement.updatedAt instanceof Date
//   );
// }

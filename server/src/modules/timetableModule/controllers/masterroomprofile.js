const HttpException = require("../../../models/http-exception");
const Masterroom = require("../../../models/masterroom");


class MroomController {
    async createRoom(req,res) {
        const newRoom = req.body;
        try {
          const createdRoom = await Masterroom.create(newRoom);
          res.json(createdRoom)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getRoom(req, res) {
       try {
          const roomlist = await Masterroom.find();
          res.json(roomlist)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getRoomById(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          const data = await Masterroom.findById(id);
          if (!data) throw new HttpException(400, "data does not exists");
          return data;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async getRoomByDepartment(department) {
        if (!department) {
          throw new HttpException(400, "Invalid Department");
        }
        try {
          const data = await Masterroom.find({ dept: department });
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
        // if (!isValidAnnouncement(announcement)) {
        //   return res.status(400).json({ error: "Invalid Announcement data" });
        // }
        try {
          await Masterroom.findByIdAndUpdate(id, announcement);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await Masterroom.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
    }


module.exports = MroomController;


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

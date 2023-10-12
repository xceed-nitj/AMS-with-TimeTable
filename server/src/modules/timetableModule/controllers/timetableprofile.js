const TimeTable = require("../../../models/timetable");
const generateUniqueLink = require("../helper/createlink");
const HttpException = require("../../../models/http-exception");


class TableController {
    async createTable(req,res) 
    {
      const data = req.body;
      try {
        const newCode = await generateUniqueLink();
        const newTimeTable = new TimeTable({
          ...data,
          code: newCode, 
        });
        const createdTT = await newTimeTable.save(); 
        res.json(createdTT);
      } 
      catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }

    async getTable(req, res) 
    {
      try {
          const TableField = await TimeTable.find();
          res.json(TableField)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }

    async getTableById(id) {
      if (!id) {
        throw new HttpException(400, "Invalid Id");
      }
      try {
        const data = await TimeTable.findById(id);
  
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
        await TimeTable.findByIdAndUpdate(id, announcement);
      } catch (e) {
        throw new HttpException(500, e.message || "Internal Server Error");
      }
    }

    async deleteId(id) {
      if (!id) {
        throw new HttpException(400, "Invalid Id");
      }
      try {
        await TimeTable.findByIdAndDelete(id);
      } catch (e) {
        throw new HttpException(500, e.message || "Internal Server Error");
      }
    }


}
module.exports = TableController;



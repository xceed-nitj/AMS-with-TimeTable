const HttpException = require("../../../models/http-exception");
const AddAllotment = require("../../../models/allotment");

class AllotmentController {
      async  AddAllotment(req, res) {
        const newallotment = req.body;
        try {
          const createdallotment = await AddAllotment.create(newallotment);
          res.json(createdallotment)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }
      
      async getAddedAllotment(req, res) {
       try {
          const list = await AddAllotment.find();
          res.json(list)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getSessions() {
        try {
          const uniqueSessions = await AddAllotment.distinct('session');
          
          return uniqueSessions;
        } catch (error) {
          throw error; 
        }
      }

      async getAddedAllotmentById(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          const data = await AddAllotment.findById(id);
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
          await AddAllotment.findByIdAndUpdate(id, announcement);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await AddAllotment.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
    }

module.exports = AllotmentController;



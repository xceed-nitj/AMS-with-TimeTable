const HttpException = require("../../../models/http-exception");
const addSem = require("../../../models/addsem");


class AddSemController {
      async  AddSem(req, res) {
        const newSem = req.body;
        try {
          const createdsem = await addSem.create(newSem);
          res.json(createdsem)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getSem() {
        try {
          const uniqueSem = await addSem.distinct('sem');
          
          return uniqueSem;
        } catch (error) {
          throw error; 
        }
      }
      
      async getAddedSem(req, res) {
       try {
          const semList = await addSem.find();
          res.json(semList)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }
      

      async getAddedSemById(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          const data = await addSem.findById(id);
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
          await addSem.findByIdAndUpdate(id, announcement);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await addSem.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
    }


module.exports = AddSemController;



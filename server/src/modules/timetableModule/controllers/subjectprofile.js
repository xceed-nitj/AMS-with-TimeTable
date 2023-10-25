const TimetableEntry = require('../../../models/subject');
const HttpException = require("../../../models/http-exception");

class SubjectController{
  async createTimetableEntry(req,res) {
    const newSub = req.body;
    try {
      const createdSub = await TimetableEntry.create(newSub);
      res.json(createdSub)
      return;
    } catch (error) {
      console.error(error); 
      res.status(500).json({ error: "Internal server error" });
    }
  }

      async getSubject(req, res) {
        try {
           const subjectList = await TimetableEntry.find();
           res.json(subjectList)
           return;
         } catch (error) {
           console.error(error); 
           res.status(500).json({ error: "Internal server error" });
         }
       }

       async getSubjectById(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          const data = await TimetableEntry.findById(id);
    
          if (!data) throw new HttpException(400, "data does not exists");
    
          return data;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async updateID(id, updated) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await TimetableEntry.findByIdAndUpdate(id, updated);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await TimetableEntry.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
}

module.exports = SubjectController;
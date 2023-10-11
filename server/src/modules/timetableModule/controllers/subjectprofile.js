const TimetableEntry = require('../../../models/subject');
const HttpException = require("../../../models/http-exception");

class SubjectController{
    createTimetableEntry = async (req, res) => {
        try {
          const newentry = req.body;
          const existingEntry = await TimetableEntry.findOne({ Slot: newentry.Slot, Day: newentry.Day });
          if (existingEntry) {
            return res.status(400).json({ error: 'Timetable slot already occupied' });
          }
          const newTimetableEntry = req.body;
          const createdEntry = await TimetableEntry.create(newTimetableEntry);
          res.json(newTimetableEntry)
          return;
      
        } catch (error) {
          console.error('Error creating timetable entry:', error);
          res.status(500).json({ error: 'Internal Server Error' });
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
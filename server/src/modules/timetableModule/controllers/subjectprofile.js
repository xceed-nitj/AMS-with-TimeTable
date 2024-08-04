const TimetableEntry = require('../../../models/subject');
// const Subject=require('../../../models/subject');
const HttpException = require("../../../models/http-exception");
const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();
const TableController = require("../controllers/timetableprofile");
const tableController = new TableController();




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

      async getSem() {
        try {
          const uniquesems = await TimetableEntry.distinct('sem');
          
          return uniquesems;
        } catch (error) {
          throw error; 
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

     async getFilteredSubject (code, sem){
        try {
          const subjects = await TimetableEntry.find({ code, sem }).select('subName');
      
      return subjects;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      };

      async getFirstYearDeptSubject (code, dept){
        try {
          const session = await TimeTableDto.getSessionByCode(code);
          const firstyear=await tableController.getCodeOfDept('Basic Sciences', session)
          const firstyearcode=firstyear.code;
          const subjects = await TimetableEntry.find({ code: firstyearcode, dept });
      
      return subjects;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      };



      async getSubjectByCode(code) {
        try {
          const subject = await TimetableEntry.find({ code });
          return subject;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
      
      
      async getSubjectBySession (code){
        try {
          const  session = await TimeTableDto.getSessionByCode(code);
          const  allcode=await TimeTableDto.getAllCodesOfSession(session);
          const final = [];
          for (const code of allcode) {
            const subjects = await TimetableEntry.find({code});
            // console.log(subjects)
            final.push(...subjects);
          }
          // console.log('finaldata',final)
      
      return final;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      };

        async deleteSubjectsByCode(code) {
          try {
      
            await TimetableEntry.deleteMany({ code });
      
          } catch (error) {
            throw new Error("Failed to delete subjects by code");
          }
        };
      

}

module.exports = SubjectController;
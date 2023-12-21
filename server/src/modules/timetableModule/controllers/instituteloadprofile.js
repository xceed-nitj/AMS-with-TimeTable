const HttpException = require("../../../models/http-exception");
const instituteLoad = require("../../../models/instituteLoad");

const lockSem = require("../../../models/locksem");

const LockTimeTableController= require("./locktimetable")
const lockTimeTableController = new LockTimeTableController();
const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();

const MasterSemController= require("./mastersemprofile")
const masterSemController = new MasterSemController();

const LockSem = require("../../../models/locksem");
const MasterSem = require("../../../models/mastersem");
const Subject = require("../../../models/subject");


class InstituteLoadController {
      async  AddInstituteLoad(req, res) {
        const newLoad = req.body;
        try {
          const createdLoad = await instituteLoad.create(newLoad);
          res.json(createdLoad)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }
    
      async getInstituteLoad(req, res) {
       try {
        const session=req.body.session;
          const instituteLoad = await instituteLoad.find({session});
          res.json(instituteLoad)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }
    
async calculateInstituteLoad(req, res) {
    try {
      const currentSession = req.params.session; 
      const allcodes = await TimeTableDto.getAllCodesOfSession(currentSession);
      for (const code of allcodes) {
        const codeData = await LockSem.find({code});
        for (const data of codeData) {
          if(data.slotData.length>0 && data.slotData[0]!='')
          {
            const semDetails= await MasterSem.find({sem:data.sem})
            for (const slotItem of data.slotData) {
                const subDetails= await Subject.find({subName:slotItem.subject})
            }

          }
        }  
      }

              } catch (error) {
           console.error(error); 
           res.status(500).json({ error: "Internal server error" });
         }
       }
     

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await instituteLoad.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }


    }


module.exports = InstituteLoadController;



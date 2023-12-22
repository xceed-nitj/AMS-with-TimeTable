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
const Faculty = require("../../../models/faculty");


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
          console.log('All Codes:', allcodes);
          await instituteLoad.deleteMany({ session: currentSession });
      
          for (const code of allcodes) {
              console.log('Processing code:', code);
            
            const codeData = await LockSem.find({ code });

            
            for (const data of codeData) {
              if (data.slotData.length > 0 && data.slotData[0] !== '') {
                const semDetails = await MasterSem.find({ sem: data.sem });
      
                for (const slotItem of data.slotData) {
                  // console.log('Processing Slot Item:', slotItem);
                  if (slotItem.subject && slotItem.faculty) {
                    const subDetails = await Subject.find({ subName: slotItem.subject });
                    const facultyDetails = await Faculty.find({ name: slotItem.faculty });
                    // console.log(facultyDetails)
                    // Check if a record with the same faculty name exists
                    const existingRecord = await instituteLoad.findOne({
                      session: currentSession,
                      name: slotItem.faculty
                    });
      
                    if (existingRecord) {
                      // If the record exists, push the new data into the arrays
                      // console.log('Updating Existing Record:', existingRecord);
                      await instituteLoad.updateOne(
                        { _id: existingRecord._id },
                        {
                          $push: {
                            sem: semDetails[0].type,
                            type: subDetails[0].type,
                            load: 1, // You can modify this based on your actual structure
                          },
                        }
                      );
                    } else {
                      // If the record doesn't exist, create a new record
                      // console.log('Creating New Record:', slotItem.faculty);
                      if (facultyDetails && facultyDetails[0].dept && facultyDetails[0].designation)
                      {
                      const loadInstance = new instituteLoad({
                        session: currentSession,
                        name: slotItem.faculty,
                        dept: facultyDetails[0].dept ||'',
                        designation: facultyDetails[0].designation||'',
                        sem: [semDetails[0].type],
                        type: [subDetails[0].type],
                        load: 1, // You can modify this based on your actual structure
                      });
      
                      await loadInstance.save();
                    }
                  }
                  }
                }
              }
            }
          }
          const loads = await instituteLoad.find({ session: currentSession });
      // return loads;
          res.status(200).json({loads, message: "Institute load calculation completed successfully" });
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



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
const CommonLoad = require("../../../models/commonLoad");

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
        const session=req.params.session;
        const dept=req.params.dept;
          const loads= await instituteLoad.find({session,dept});
          res.json(loads)
          // return;
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
            
            const codeData2 = await CommonLoad.find({ code });

            for(const data of codeData2){
              const subDetails = await Subject.find({ subName: data.subName });
              const facultyDetails = await Faculty.find({ name: data.faculty });
              const semDetails = await MasterSem.find({ sem: data.sem });
          
              const existingRecord = await instituteLoad.findOne({
                session: currentSession,
                name: data.faculty
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
                      load: data.hrs, // You can modify this based on your actual structure
                    },
                  }
                );
              } else {
                // If the record doesn't exist, create a new record
                // console.log('Creating New Record:', slotItem.faculty);
                const loadInstance = new instituteLoad({
                  session: currentSession,
                  name: data.faculty,
                  dept: facultyDetails[0] ? facultyDetails[0].dept : null,
                  designation: facultyDetails[0] ? facultyDetails[0].designation : null,                      
                  sem: [semDetails[0].type],
                  type: [subDetails[0].type],
                  load: data.hrs, // You can modify this based on your actual structure
                });
                console.log('commonlaod',loadInstance)  
                await loadInstance.save();
            }       
            }
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
                      const loadInstance = new instituteLoad({
                        session: currentSession,
                        name: slotItem.faculty,
                        dept: facultyDetails[0] ? facultyDetails[0].dept : null,
                        designation: facultyDetails[0] ? facultyDetails[0].designation : null,                      
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



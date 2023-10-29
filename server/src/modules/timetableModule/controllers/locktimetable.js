const ClassTable = require("../../../models/classtimetable");
const LockSem = require("../../../models/locksem");

const HttpException = require("../../../models/http-exception");

const LockTimeTabledto = require("../dto/locktimetable");
const LockTimeTableDto = new LockTimeTabledto();
const TimeTabledto=require("../dto/timetable")
const TimeTableDto=new TimeTabledto(); 

class LockTimeTableController {
  async locktt(req, res) {
        try {
          // Get the code parameter from the request
          const { code } = req.body;
      
          // Fetch data from 'class table' based on the code
          const classTableData = await ClassTable.find({ code });
          // console.log(classTableData)
          for (const dataItem of classTableData) {
            const { code, day, slot, slotData, sem } = dataItem;
      
            // Check if data with the specified code, day, and slot exists in 'lock classtable'
            const existingData = await LockSem.findOne({ code, day, slot, sem });
      
            if (existingData) {
              // If data with the code, day, and slot exists, update the existing data
              existingData.slotData = slotData;
              await existingData.save();
            } else {
              // If data with the code, day, and slot doesn't exist, insert new data
              // console.log(dataItem)
                           await LockSem.create({
                            day: dataItem.day,
                            slot: dataItem.slot,
                            slotData: dataItem.slotData,
                            sem: dataItem.sem,
                            code: dataItem.code,
                            timetable: dataItem.timetable
                           }
                            
                            );
            }
          }
      
          res.status(200).json({ message: 'Data Locked successfully' });
      
        } catch (err) {
          res.status(500).json({ error: 'An error occurred' });
        }
        }
 

  async classtt(req, res) {
    try {
      const sem = req.params.sem;
      const code = req.params.code;
      const records = await LockSem.find({ sem, code });
      const timetableData = {};  
      records.forEach((record) => {
        const { day, slot, slotData } = record;
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
        
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
  
      const formattedSlotData = slotData.map(({ subject, faculty, room }) => ({
      subject,
      faculty,
      room,
    }));

    timetableData[day][slot].push(formattedSlotData);
        timetableData.sem = sem;
        timetableData.code = code;
      });
  
      res.status(200).json(timetableData);
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching and formatting data from the database');
    }
  }
  

  async facultytt(req, res) {
    
    // const code=req.params.code;
    let session ='';
   const  facultyname=req.params.faculty;      
       try {
      
      if(!req.params.session)
      {
      session = await TimeTableDto.getSessionByCode(req.params.code);
       }
      else
      {
      session=req.params.session;
      // const facultyId=req.params.facultyId;
      // facultyname = await findFacultyById(facultyId); 
    }
      const records = await LockTimeTableDto.findFacultyDataWithSession(session,facultyname);
      // Create an empty timetable data object
      const timetableData = {};
  
      // Iterate through the records and format the data
      records.forEach((record) => {
        // Extract relevant data from the record
        const { day, slot, slotData,sem } = record;
  
        // Create or initialize the day in the timetableData
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
  
        // Create or initialize the slot in the day
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
   // Iterate through the slotData array and filter based on faculty name
   const matchingSlotData = slotData.filter((slotItem) => slotItem.faculty === facultyname);

   // Access the matching values from the filtered slotData and push them
   const formattedSlotData = matchingSlotData.map(({ subject, room }) => ({
       subject,
       sem,
       room,
   }));

    timetableData[day][slot].push(formattedSlotData);
        // Set the sem and code for the timetable
      });
      console.log(timetableData)
      res.status(200).json(timetableData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  
  async roomtt(req, res) {
    const roomno = req.params.room; 
    const code=req.params.code;
    console.log('room no:', roomno);
    try {
      let session ='';
      if(!req.params.session)
      {
      session = await TimeTableDto.getSessionByCode(code);
      }
      else
      {
      session=req.params.session;
      }
      
      const records = await LockTimeTableDto.findRoomDataWithSession(session,roomno);
      const timetableData = {};
      records.forEach((record) => {
      const { day, slot, slotData,sem } = record;
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
   
   // Iterate through the slotData array and filter based on faculty name
   const matchingSlotData = slotData.filter((slotItem) => slotItem.room === roomno);
 
  const formattedSlotData = matchingSlotData.map(({ subject, faculty }) => ({
      subject,
      faculty,    
      sem,
    }));

    timetableData[day][slot].push(formattedSlotData);
        // Set the sem and code for the timetable
      });
      console.log('rooom data',timetableData)
      res.status(200).json(timetableData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

}
module.exports = LockTimeTableController;



const ClassTable = require("../../../models/classtimetable");
const LockSem = require("../../../models/locksem");

const HttpException = require("../../../models/http-exception");

// const ClassTimeTabledto = require("../dto/classtimetable");
// const ClassTimeTableDto = new ClassTimeTabledto();
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
            const { code, day, slot, slotData } = dataItem;
      
            // Check if data with the specified code, day, and slot exists in 'lock classtable'
            const existingData = await LockSem.findOne({ code, day, slot });
      
            if (existingData) {
              // If data with the code, day, and slot exists, update the existing data
              existingData.slotData = slotData;
              await existingData.save();
            } else {
              // If data with the code, day, and slot doesn't exist, insert new data
              await LockSem.create({ code, day, slot, slotData});
            }
          }
      
          res.status(200).json({ message: 'Data Locked successfully' });
      
        } catch (err) {
          res.status(500).json({ error: 'An error occurred' });
        }
        }
 

  async getlockedclasstt(req, res) {
    try {
      const sem = req.params.sem;
      const code = req.params.code;
  
      // Query the database to find records that match the sem and code
      const records = await LockSem.find({ sem, code });
  
      // Create an empty timetable data object
      const timetableData = {};
  
      // Iterate through the records and format the data
      records.forEach((record) => {
        // Extract relevant data from the record
        const { day, slot, slotData } = record;
  
        // Create or initialize the day in the timetableData
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
  
        // Create or initialize the slot in the day
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
  
        // Access the "slotData" array and push its values
     // Access the "slotData" array and push its values
     const formattedSlotData = slotData.map(({ subject, faculty, room }) => ({
      subject,
      faculty,
      room,
    }));

    timetableData[day][slot].push(formattedSlotData);
        // Set the sem and code for the timetable
        timetableData.sem = sem;
        timetableData.code = code;
      });
  
      res.status(200).json(timetableData);
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching and formatting data from the database');
    }
  }
  

  // async facultytt(req, res) {
  //   const facultyname = req.params.facultyname; 
  //   const code=req.params.code;
  //   console.log('facultyname:', facultyname);
  //   try {
  //     // Query the ClassTable collection based on the 'faculty' field
  //     // const facultydata = await ClassTable.find({ faculty: facultyname });
  //     const records = await ClassTimeTableDto.findFacultyDataWithSession(code,facultyname);
  //     // Create an empty timetable data object
  //     const timetableData = {};
  
  //     // Iterate through the records and format the data
  //     records.forEach((record) => {
  //       // Extract relevant data from the record
  //       const { day, slot, slotData,sem } = record;
  
  //       // Create or initialize the day in the timetableData
  //       if (!timetableData[day]) {
  //         timetableData[day] = {};
  //       }
  
  //       // Create or initialize the slot in the day
  //       if (!timetableData[day][slot]) {
  //         timetableData[day][slot] = [];
  //       }
  
  //       // Access the "slotData" array and push its values
  //    // Access the "slotData" array and push its values
  //    const formattedSlotData = slotData.map(({ subject, room }) => ({
  //     subject,
  //     sem,    
  //     room,
  //   }));

  //   timetableData[day][slot].push(formattedSlotData);
  //       // Set the sem and code for the timetable
  //     });
  //     console.log(timetableData)
  //     res.status(200).json(timetableData);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // }
  
  // async roomtt(req, res) {
  //   const roomno = req.params.room; 
  //   const code=req.params.code;
  //   console.log('room no:', roomno);
  //   try {
  //     const records = await ClassTimeTableDto.findRoomDataWithSession(code,roomno);
  //     const timetableData = {};
  //     records.forEach((record) => {
  //     const { day, slot, slotData,sem } = record;
  //       if (!timetableData[day]) {
  //         timetableData[day] = {};
  //       }
  //       if (!timetableData[day][slot]) {
  //         timetableData[day][slot] = [];
  //       }
  //    const formattedSlotData = slotData.map(({ subject, faculty }) => ({
  //     subject,
  //     faculty,    
  //     sem,
  //   }));

  //   timetableData[day][slot].push(formattedSlotData);
  //       // Set the sem and code for the timetable
  //     });
  //     console.log('rooom data',timetableData)
  //     res.status(200).json(timetableData);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // }


}
module.exports = LockTimeTableController;



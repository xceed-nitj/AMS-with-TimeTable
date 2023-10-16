const ClassTable = require("../../../models/classtimetable");
const HttpException = require("../../../models/http-exception");


class ClassTimeTableController {
  async savett(req, res) {
    const timetableData = req.body;
    try {
      for (const day of Object.keys(timetableData.timetableData)) {
        const dayData = timetableData.timetableData[day];
        for (const slot of Object.keys(dayData)) {
          const slotData = dayData[slot];
          const { code, sem } = timetableData;
  
          const query = {
            day,
            slot,
            code,
            sem,
          };
  
          const existingRecord = await ClassTable.findOne(query);
  
          if (existingRecord) {
            // If a record already exists, update it with the new array of subjects
            existingRecord.slotData = slotData;
            await existingRecord.save();
            console.log(`Updated class table data for ${day} - ${slot}`);
          } else {
            // If no record exists, create a new one with the array of subjects
            const classTableInstance = new ClassTable({
              day,
              slot,
              slotData: slotData,
              code,
              sem,
            });
            await classTableInstance.save();
            console.log(`Saved class table data for ${day} - ${slot}`);
          }
        }
      }
  
      res.status(200).json({ message: "Data updated or created successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
      
  async classtt(req, res) {
    try {
      const sem = req.params.sem;
      const code = req.params.code;
  
      // Query the database to find records that match the sem and code
      const records = await ClassTable.find({ sem, code });
  
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
  

  async facultytt(req, res) {
    const facultyname = req.params.facultyname; 
    console.log('facultyname:', facultyname);
    try {
      // Query the ClassTable collection based on the 'faculty' field
      const facultydata = await ClassTable.find({ faculty: facultyname });
  
      res.status(200).json(facultydata);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  
  async roomtt(req, res) {
    const roomno = req.params.room; 
    console.log('required no:', roomno);
    try {
      // Query the ClassTable collection based on the 'faculty' field
      const roomdata = await ClassTable.find({ room: roomno });
      console.log(roomdata)
      res.status(200).json(roomdata);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  



}
module.exports = ClassTimeTableController;



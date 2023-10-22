const ClassTable = require("../../../models/classtimetable");
const HttpException = require("../../../models/http-exception");

const ClassTimeTabledto = require("../dto/classtimetable");
const ClassTimeTableDto = new ClassTimeTabledto();

class ClassTimeTableController {
  async savett(req, res) {
    const timetableData = req.body.timetableData; // Access the timetableData object
    try {
      for (const day of Object.keys(timetableData)) {
        const dayData = timetableData[day];
        for (const slot of Object.keys(dayData)) {
          let slotData = dayData[slot]; // Access the slotData array
          slotData = slotData.flat(); 
          const { code, sem } = req.body;
  
          const query = {
            day,
            slot,
            code,
            sem,
          };
  
          const existingRecord = await ClassTable.findOne(query);
  
          if (existingRecord) {
            // If a record already exists, update it with the new slotData
            existingRecord.slotData = slotData;
            await existingRecord.save();
            console.log(`Updated class table data for ${day} - ${slot}`);
          } else {
            // If no record exists, create a new one with the slotData
            const timetableObject= await ClassTimeTableDto.findTimeTableIdByCode(code);
            const classTableInstance = new ClassTable({
              day,
              slot,
              slotData,
              code,
              sem,
              timetable:timetableObject,
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
 
  async saveslot(req, res) {
    const day = req.params.day;
    const slot = req.params.slot;
    const slotData = req.body.slotData; // Access the slotData object
    const code = req.body.code;
    const sem = req.body.sem;
    try {
      const query = {
        day,
        slot,
        code,
        sem,
      };
      // const facultySlots = await ClassTimeTableDto.findFacultyDataWithSession(code, slotData.faculty);
      
      const isFacultyAvailable = await ClassTimeTableDto.isFacultySlotAvailable(code, day, slot, slotData.faculty);
      const isRoomAvailable = await ClassTimeTableDto.isRoomSlotAvailable(code, day, slot, slotData.room);

      if (isFacultyAvailable)
      {
        if (isRoomAvailable)
        {  
      const existingRecord = await ClassTable.findOne(query);
      if (existingRecord) {
        existingRecord.slotData = slotData;
        await existingRecord.save();
        console.log(`Updated class table data for ${day} - ${slot}`);
      } else {
        const timetableObject = await ClassTimeTableDto.findTimeTableIdByCode(code);
        const classTableInstance = new ClassTable({
          day,
          slot,
          slotData,
          code,
          sem,
          timetable: timetableObject,
        });
        await classTableInstance.save();
        console.log(`Saved class table data for ${day} - ${slot}`);
      }
      res.status(200).json({ message: "Slot saved" });
    }
    else {
      res.status(400).json({ error: "Room Slot is already occupied. check Room TT for more details" });
    }
  }
    else {
      res.status(400).json({ error: "Slot is already occupied by faculty. check faculty TT for more details" });
    }
  }
    catch (error) {
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
    const code=req.params.code;
    console.log('facultyname:', facultyname);
    try {
      // Query the ClassTable collection based on the 'faculty' field
      // const facultydata = await ClassTable.find({ faculty: facultyname });
      const records = await ClassTimeTableDto.findFacultyDataWithSession(code,facultyname);
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
  
        // Access the "slotData" array and push its values
     // Access the "slotData" array and push its values
     const formattedSlotData = slotData.map(({ subject, room }) => ({
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
      const records = await ClassTimeTableDto.findRoomDataWithSession(code,roomno);
      const timetableData = {};
      records.forEach((record) => {
      const { day, slot, slotData,sem } = record;
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
     const formattedSlotData = slotData.map(({ subject, faculty }) => ({
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
module.exports = ClassTimeTableController;



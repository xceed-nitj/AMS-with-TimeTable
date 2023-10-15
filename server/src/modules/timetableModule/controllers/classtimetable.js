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
          const { subject, faculty, room, code, sem } = timetableData;
          const query = {
            day,
            slot,
            code,
            sem,
          };
  
          // Try to find an existing record based on day, slot, code, and sem
          const existingRecord = await ClassTable.findOne(query);
  
          if (existingRecord) {
            // If a record already exists, update it with new data
            existingRecord.sub = slotData.subject;
            existingRecord.faculty = slotData.faculty;
            existingRecord.room = slotData.room;
            await existingRecord.save();
            console.log(`Updated class table data for ${day} - ${slot}`);
          } else {
            // If no record exists, create a new one
            const classTableInstance = new ClassTable({
              day,
              slot,
              sub: slotData.subject,
              faculty: slotData.faculty,
              room: slotData.room,
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
  
  async facultytt(req, res) {
    const facultyname = req.query.facultyname; 
    console.log(facultyname);
    try {
      // Query the ClassTable collection based on the 'faculty' field
      const facultydata = await ClassTable.find({ faculty: facultyname });
  
      res.status(200).json(facultydata);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  
  



}
module.exports = ClassTimeTableController;



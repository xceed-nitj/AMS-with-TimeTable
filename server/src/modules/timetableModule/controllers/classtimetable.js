const ClassTable = require("../../../models/classtimetable");
const HttpException = require("../../../models/http-exception");


class ClassTimeTableController {
    async savett(req, res) 
    {
      const timetableData =req.body;
      console.log(timetableData);
      console.log(timetableData.code);
      try {
        for (const day of Object.keys(timetableData.timetableData)) {
          const dayData = timetableData.timetableData[day];
        
          // Iterate through the periods (e.g., "period1", "period2", etc.) for each day
          for (const slot of Object.keys(dayData)) {
            const slotData = dayData[slot];
        
            // Create a new ClassTable instance with the data from the JSON
            const classTableInstance = new ClassTable({
              day,  // Set the day from the JSON
              slot, // Set the slot from the JSON
              sub: slotData.subject,     // Set subject from the JSON
              faculty: slotData.faculty, // Set faculty from the JSON
              room: slotData.room,
              sem:timetableData.sem,       // Set room from the JSON
              code: timetableData.code // Set code from the JSON (optional)
            });
        
            // Save the ClassTable instance to the MongoDB database using a promise
            classTableInstance.save()
              .then(() => {
                console.log(`Saved class table data for ${day} - ${slot}`);
              })
              .catch((err) => {
                console.error(`Error saving class table data: ${err}`);
              });
          }
        }
              } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }

}
module.exports = ClassTimeTableController;



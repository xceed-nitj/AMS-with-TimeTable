const TimetableEntry = require('../../../models/subject');

class StudentController{
    createTimetableEntry = async (req, res) => {
        try {
          const newentry = req.body;
      
      
          // Check if a timetable entry already exists for the given Slot and Day
          const existingEntry = await TimetableEntry.findOne({ Slot: newentry.Slot, Day: newentry.Day });
      
          if (existingEntry) {
            return res.status(400).json({ error: 'Timetable slot already occupied' });
          }
      
          // Create a new timetable entry
          const newTimetableEntry = req.body;
      
          const createdEntry = await TimetableEntry.create(newTimetableEntry);
          res.json(newTimetableEntry)
          return;
      
        } catch (error) {
          console.error('Error creating timetable entry:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      };
}

module.exports = StudentController;
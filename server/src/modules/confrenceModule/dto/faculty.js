const Faculty = require("../../../models/faculty");
const TimeTable = require('../../../models/timetable'); // Import the TimeTable model
const Facultydto = require("./faculty");
const FacultyDto = new Facultydto();

class Facultydto {
    async findFacultyById(facultyId) {
        try {
          const faculty = await Faculty.findOne({ facultyId: facultyId }).exec();
      
          if (faculty) {
            return faculty;
          } else {
            console.log('No faculty found with the specified code.');
            return null;
          }
        } catch (err) {
          console.error('An error occurred while searching for the TimeTable:', err);
          throw err; // Re-throw the error to propagate it to the calling function
        }
      }
     
    }
      module.exports = Facultydto;
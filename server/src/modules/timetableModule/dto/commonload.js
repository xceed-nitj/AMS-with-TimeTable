const Faculty = require("../../../models/faculty");

const TimeTable = require('../../../models/timetable'); // Import the TimeTable model


class CommonLoaddto {
    async IsFacultyBelongsToDept(faculty,dept) {
        try {
          const facultyExist = await Faculty.findOne({name:faculty,dept}).exec();
      
          if (facultyExist) {
            return true;
          } else {
            // console.log('No faculty found with the specified code.');
            return false;
          }
        } catch (err) {
          console.error('An error occurred while searching for the TimeTable:', err);
          throw err; // Re-throw the error to propagate it to the calling function
        }
      }
     
    }
      module.exports = CommonLoaddto;
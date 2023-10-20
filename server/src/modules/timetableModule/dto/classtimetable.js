// const ClassTable = require("../../../models/classtimetable");
const TimeTable = require('../../../models/timetable'); // Import the TimeTable model

class ClassTimeTabledto {
    async findTimeTableIdByCode(code) {
        try {
          const timetable = await TimeTable.findOne({ code: code }).exec();
      
          if (timetable) {
            return timetable._id;
          } else {
            console.log('No TimeTable found with the specified code.');
            return null;
          }
        } catch (err) {
          console.error('An error occurred while searching for the TimeTable:', err);
          throw err; // Re-throw the error to propagate it to the calling function
        }
      }
      

}
module.exports = ClassTimeTabledto;
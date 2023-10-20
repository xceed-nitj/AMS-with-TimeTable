const ClassTable = require("../../../models/classtimetable");
const TimeTable = require('../../../models/timetable'); // Import the TimeTable model
const TimeTabledto = require("./timetable");
const TimeTableDto = new TimeTabledto();

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
     
async findFacultyDataWithSession(code, faculty) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
        // const session='2023-ODD'
          const result = await ClassTable.find({
            "slotData.faculty": faculty,
          })
            .populate({
              path: "timetable",
              match: { session: session },
              model: TimeTable,
            })
            .exec();
      
          return result;
        } catch (err) {
          console.error('An error occurred while searching for faculty data:', err);
          throw err;
        }
      }

      async findRoomDataWithSession(code, room) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
        // const session='2023-ODD'
          const result = await ClassTable.find({
            "slotData.room": room,
          })
            .populate({
              path: "timetable",
              match: { session: session },
              model: TimeTable,
            })
            .exec();
      
          return result;
        } catch (err) {
          console.error('An error occurred while searching for faculty data:', err);
          throw err;
        }
      }

    }
      module.exports = ClassTimeTabledto;
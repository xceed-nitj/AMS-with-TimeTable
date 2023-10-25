const LockSem = require("../../../models/locksem");
const TimeTable = require('../../../models/timetable'); // Import the TimeTable model
const TimeTabledto = require("./timetable");
const TimeTableDto = new TimeTabledto();

class LockTimeTabledto {
     
async findFacultyDataWithSession(code, faculty) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
        //  const session="mksd"
         const result = await LockSem.aggregate([
          {
            $match: {
              "slotData.faculty": faculty,
            },
          },
          {
            $lookup: {
              from: "timetables", // Replace with your actual collection name
              localField: "timetable",
              foreignField: "_id",
              as: "timetableData",
            },
          },
          {
            $unwind: "$timetableData",
          },
          {
            $match: {
              "timetableData.session": session,
            },
          },
        ]);
                    console.log(result);
      
          return result;
        } catch (err) {
          console.error('An error occurred while searching for faculty data:', err);
          throw err;
        }
      }

async findRoomDataWithSession(code, room) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
          const result = await LockSem.aggregate([
            {
              $match: {
                "slotData.room": room,
              },
            },
            {
              $lookup: {
                from: "timetables", // Replace with your actual collection name
                localField: "timetable",
                foreignField: "_id",
                as: "timetableData",
              },
            },
            {
              $unwind: "$timetableData",
            },
            {
              $match: {
                "timetableData.session": session,
              },
            },
          ]);
      console.log('room result', result)
          return result;
        } catch (err) {
          console.error('An error occurred while searching for faculty data:', err);
          throw err;
        }
      }

    }
      module.exports = LockTimeTabledto;
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
        //  const session="mksd"
         const result = await ClassTable.aggregate([
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
          const result = await ClassTable.aggregate([
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

  async isFacultySlotAvailable(code, day, slot, faculty) {
        try {
          // Check if the faculty is assigned to this slot
          const facultySlots = await this.findFacultyDataWithSession(code, faculty);
      
          if (!facultySlots && !facultySlots[day][slot]) {
            return true; // Slot is available
          }
          console.log('slot not available')
          return false; // Slot is already occupied by the faculty
        } catch (error) {
          console.error(error);
          return false; // An error occurred while checking availability
        }
      }
      
      async isRoomSlotAvailable(code, day, slot, room) {
        try {
          // Check if the faculty is assigned to this slot
          const roomSlots = await this.findRoomDataWithSession(code, room);
      
          if (!roomSlots && !roomSlots[day][slot]) {
            return true; // Slot is available
          }
          console.log('Room slot not available')
          return false; // Slot is already occupied by the faculty
        } catch (error) {
          console.error(error);
          return false; // An error occurred while checking availability
        }
      }
  

    }
      module.exports = ClassTimeTabledto;
const TimeTable = require("../../../models/timetable");
const addRoom = require("../../../models/addroom");

const User = require("../../../models/usermanagement/user");

const generateUniqueLink = require("../helper/createlink");
const HttpException = require("../../../models/http-exception");
const getRoomByDepartment =require("./masterroomprofile");
const masterroomprofile = require("./masterroomprofile");
const AddAllotment = require("../../../models/allotment")
const MasterRoomProfile = new masterroomprofile();


class TableController {
    async createTable(req,res) 
    {
      const data = req.body;
      const userId=req.user.id;
      const existingTimeTable = await TimeTable.findOne({ user: userId, session: data.session });

    if (existingTimeTable) {
      // If a timetable already exists, you can choose to return an error or update the existing one
      // In this example, we return an error
      return res.status(400).json({ error: "Timetable already exists for this session" });
    }
      try {
        const newCode = await generateUniqueLink();
        //const userObject = await User.findById(userId)
        const newTimeTable = new TimeTable({
          ...data,
          code: newCode, 
          user: userId
        });
        const createdTT = await newTimeTable.save(); 
        const deptrooms= await MasterRoomProfile.getRoomByDepartment(data.dept);
        if (deptrooms)
        {
        for (const room of deptrooms) {
          await addRoom.create({ room: room.room, code: newCode, type:room.type });
        }
      }
        
          const roomdata= await AddAllotment.find({session: data.session})
          console.log(roomdata);
          const centralisedAllotments = roomdata[0].centralisedAllotments;
          const openElectiveAllotments = roomdata[0].openElectiveAllotments;

  // Search in centralised allotments
          const centralisedDept = centralisedAllotments.find((item) => item.dept === data.dept) || { rooms: [] };

  // Search in open elective allotments
          const electiveDept = openElectiveAllotments.find((item) => item.dept === data.dept) || { rooms: [] };

  // Combine rooms from both allotments
          const combinedRooms = [...centralisedDept.rooms, ...electiveDept.rooms];
          if(combinedRooms)
          {
          for (const room of combinedRooms) {
            await addRoom.create({ room: room.room, code: newCode, type:'Centralised Classroom' });
          }
        }
  
        res.json(createdTT);
      } 
      catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }

    async savett(req, res) 
    {
      const timetableData =req.body;
      // console.log(timetableData);
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
              room: slotData.room,       // Set room from the JSON
              code: timetableData.code || ""  // Set code from the JSON (optional)
            });
        
            // Save the ClassTable instance to the MongoDB database
            classTableInstance.save((err) => {
              if (err) {
                console.error(`Error saving class table data: ${err}`);
              } else {
                console.log(`Saved class table data for ${day} - ${slot}`);
              }
            });
          }
        }
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }

    async getUserTable(req, res) 
    {
      const userId=req.user.id;
      try {
          const TableField = await TimeTable.find({user: userId});
          res.json(TableField)
          return;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }

    async getTableByCode(code) 
    {
      // const code=req.params.code;
      try {
          const TableField = await TimeTable.find({code});
          return TableField;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
    }


    async getTableById(id) {
      if (!id) {
        throw new HttpException(400, "Invalid Id");
      }
      try {
        const data = await TimeTable.findById(id);
  
        if (!data) throw new HttpException(400, "data does not exists");
  
        return data;
      } catch (e) {
        throw new HttpException(500, e.message || "Internal Server Error");
      }
    }

    async updateID(id, announcement) {
      if (!id) {
        throw new HttpException(400, "Invalid Id");
      }
      // if (!isValidAnnouncement(announcement)) {
      //   return res.status(400).json({ error: "Invalid Announcement data" });
      // }
      try {
        await TimeTable.findByIdAndUpdate(id, announcement);
      } catch (e) {
        throw new HttpException(500, e.message || "Internal Server Error");
      }
    }

    async deleteId(id) {
      if (!id) {
        throw new HttpException(400, "Invalid Id");
      }
      try {
        await TimeTable.findByIdAndDelete(id);
      } catch (e) {
        throw new HttpException(500, e.message || "Internal Server Error");
      }
    }

    
  async deleteTableByCode(code) {
    try {

      await TimeTable.deleteMany({ code });

    } catch (error) {
      throw new Error("Failed to delete by code");
    }
  }

  async getAllSessAndDept() {
    try {
      // Step 1: Get distinct sessions with their creation times
      const sessionsWithCreationTimes = await TimeTable.find(
        {},
        { session: 1, created_at: 1 }
      ).sort({ created_at: -1 });
  
      // Extract unique sessions and sort them by creation time
      const uniqueSessions = [...new Set(sessionsWithCreationTimes.map(doc => doc.session))];
      
      // Step 2: Get distinct departments
      const uniqueDept = await TimeTable.distinct('dept');
      
      // Step 3: Sort departments alphabetically
      uniqueDept.sort((a, b) => a.localeCompare(b));
  
      return { uniqueSessions, uniqueDept };
    } catch (error) {
      throw error;
    }
  }
  
  async getCodeOfDept(dept, session) {
    try {
      const code= await TimeTable.findOne({dept, session});
      return code;
    } catch (error) {
      throw error; 
    }
  }


  async getAllCodes(session) {
    try {
      const codes = await TimeTable.find({ session});
      // console.log(codes);
      return codes;
    } catch (error) {
      throw error;
    }
  }


}
module.exports = TableController;



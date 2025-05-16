const HttpException = require("../../../models/http-exception");
const AddAllotment = require("../../../models/allotment");
const addRoom=require("../../../models/addroom");
const addSem=require("../../../models/addsem");
const addFaculty=require("../../../models/addfaculty");
const ClassTable=require("../../../models/classtimetable")
const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();
const Subject=require("../../../models/subject")
const AddRoomController = require("./addroomprofile");
const TimeTable = require("../../../models/timetable");
const addRoomController = new AddRoomController();

class ImportController {
  async importInstituteRoomAllocation(req, res) {
    // const newallotment = req.body;
    const fromSession=req.body.fromSession;
    const toSession=req.body.toSession;
    try {
      const existingAllotment = await AddAllotment.findOne({ session: fromSession });
      const newAllotment = await AddAllotment.findOne({ session: toSession });     
      if (existingAllotment && newAllotment) {
        const session= toSession;
        const centralisedAllotments= existingAllotment.centralisedAllotments;
        const openElectiveAllotments= existingAllotment.openElectiveAllotments;
        const importData={
          session:session,
          centralisedAllotments:centralisedAllotments,
          openElectiveAllotments:openElectiveAllotments 
        }
        await AddAllotment.updateOne({ session: session }, importData);
        res.status(200).json({ message: 'Allotment Imported Successfully' });
      }
      else
      {
        res.status(400).json({ message: 'Session not found' });

      }
    } 
      catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }


  async importTTData(req, res) {
    const { dept, fromSession, toSession } = req.body;
  
    try {
      const existingCode = await TimeTable.findOne({ session: fromSession, dept });
      const newCode = await TimeTable.findOne({ session: toSession, dept });
  
      if (!existingCode || !newCode) {
        return res.status(400).json({ message: 'Session not found' });
      }
  
      const oldCode = existingCode.code;
      const newCodeVal = newCode.code;

      await addRoom.deleteMany({ code: newCodeVal });
      await Subject.deleteMany({ code: newCodeVal });
      await addSem.deleteMany({ code: newCodeVal });
      await ClassTable.deleteMany({ code: newCodeVal });
  
      // Copy Room Data
      const roomData = await addRoom.find({ code: oldCode });
      const newRoomData = roomData.map(item => ({
        ...item.toObject(),
        _id: undefined, // remove _id to prevent duplicate key errors
        code: newCodeVal
      }));
      await addRoom.insertMany(newRoomData);

      const subjectData = await Subject.find({ code: oldCode });
      const newSubjectData = subjectData.map(item => ({
        ...item.toObject(),
        _id: undefined, // remove _id to prevent duplicate key errors
        code: newCodeVal
      }));
      await Subject.insertMany(newSubjectData);
  
      // Copy Sem Data
      const semData = await addSem.find({ code: oldCode });
      const newSemData = semData.map(item => ({
        ...item.toObject(),
        _id: undefined,
        code: newCodeVal
      }));
      await addSem.insertMany(newSemData);
  
    // Copy Class Table Data (excluding faculty field)
const ttData = await ClassTable.find({ code: oldCode });
const newTTData = ttData.map(item => {
  const newItem = item.toObject();
  newItem._id = undefined;
  newItem.code = newCodeVal;

  // Remove or empty faculty in slotData array
  if (Array.isArray(newItem.slotData)) {
    newItem.slotData = newItem.slotData.map(slot => ({
      ...slot,
      faculty: "" // or use `undefined` or delete slot.faculty
    }));
  }

  return newItem;
});

await ClassTable.insertMany(newTTData);

  
      return res.status(200).json({ message: 'Timetable data imported successfully.' });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  

}
module.exports = ImportController;



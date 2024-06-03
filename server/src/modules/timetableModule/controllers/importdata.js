const HttpException = require("../../../models/http-exception");
const AddAllotment = require("../../../models/allotment");
const addRoom=require("../../../models/addroom");

const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();

const AddRoomController = require("./addroomprofile");
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
}
module.exports = ImportController;



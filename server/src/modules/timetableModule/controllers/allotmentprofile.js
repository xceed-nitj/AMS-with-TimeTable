const HttpException = require("../../../models/http-exception");
const AddAllotment = require("../../../models/allotment");
const addRoom=require("../../../models/addroom");

const TimeTabledto = require("../dto/timetable");
const TimeTable = require("../../../models/timetable"); 
const TimeTableDto = new TimeTabledto();

const AddRoomController = require("../controllers/addroomprofile");
const addRoomController = new AddRoomController();

class AllotmentController {
  async AddAllotment(req, res) {
    const newallotment = req.body;
    const session = newallotment.session;
  
    // Handle set-current-session action for POST requests
    if (req.query.action === 'set-current-session') {
      return await this.setCurrentSession(req, res);
    }

    try {
      const existingAllotment = await AddAllotment.findOne({ session: session });
      
      if (!existingAllotment) {
        // If the session doesn't exist, create a new allotment
        const createdAllotment = await AddAllotment.create(newallotment);  
        res.json(createdAllotment);
      } else {
        // If the session exists, update the existing allotment
        const updatedAllotment = await AddAllotment.updateOne({ session: session }, newallotment);
        
        const codes = await TimeTableDto.getAllCodesOfSession(session);
        for (let code of codes)
        {
          await addRoomController.deleteCentralisedRoomByCode(code);
          const ttdetails = await TimeTableDto.getTTdetailsByCode(code);
          const centralisedAllotments = newallotment.centralisedAllotments;
          const openElectiveAllotments = newallotment.openElectiveAllotments;
          const centralisedDept = centralisedAllotments.find((item) => item.dept === ttdetails.dept) || { rooms: [] };
          const electiveDept = openElectiveAllotments.find((item) => item.dept === ttdetails.dept) || { rooms: [] };
          const combinedRooms = [...centralisedDept.rooms, ...electiveDept.rooms];
          if(combinedRooms)
          {
          for (const room of combinedRooms) {
            await addRoom.create({ room: room.room, code: code, type:'Centralised Classroom' });
          }
        }
      }
        res.json(updatedAllotment);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
        
  async getAllotment(req, res) {
    try {
      // Handle special action query parameter for GET requests
      if (req.query.action === 'current-status') {
        return await this.getCurrentStatus(req, res);
      }

      // Original getAllotment logic
      let session = '';
      if(req.query.code) {
        session = await TimeTableDto.getSessionByCode(req.query.code);
      } else {  
        session = req.query.session;
      }

      try {
        const list = await AddAllotment.find({ session});
        return res.status(200).json(list);
      } catch (error) {
        console.error('Error fetching allotment:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
      
    } catch (error) {
      console.error(error); 
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getSessions() {
    try {
      // Step 1: Get distinct sessions, excluding the marker
      const uniqueSessions = await AddAllotment.distinct('session');
      
      // Filter out the special marker
      const filteredSessions = uniqueSessions.filter(s => s !== '__CURRENT_SESSION_MARKER__');
      
      if (filteredSessions.length === 0) {
        return [];
      }
  
      // Step 2: Fetch sessions with their creation times
      const sessionsWithCreationTimes = await AddAllotment.find(
        { session: { $in: filteredSessions } },
        { session: 1, created_at: 1 }
      ).sort({ created_at: -1 }); // Step 3: Sort by creation time in descending order
  
      // Extract unique sessions in sorted order
      const sortedSessions = sessionsWithCreationTimes.map(doc => doc.session);
  
      return sortedSessions;
    } catch (error) {
      throw error;
    }
  }

  async setCurrentSession(req, res) {
    const { session } = req.body;
    try {
      // Store current session in Allotment collection using upsert
      // This creates or updates a special document with a fixed identifier
      const result = await AddAllotment.findOneAndUpdate(
        { session: '__CURRENT_SESSION_MARKER__' }, // Special marker document
        { 
          session: '__CURRENT_SESSION_MARKER__',
          currentSessionValue: session, // Store the actual current session here
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log(' Current session marker updated:', result);
      console.log(' Set current session to:', session);
      
      // Also update TimeTable for backwards compatibility (if entries exist)
      await TimeTable.updateMany({}, { $set: { currentSession: false } });
      const entriesForSession = await TimeTable.countDocuments({ session: session });
      
      if (entriesForSession > 0) {
        await TimeTable.updateMany({ session: session }, { $set: { currentSession: true } });
      }

      res.status(200).json({ message: `Session ${session} is now current.` });
    } catch (error) {
      console.error(' Error setting current session:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurrentStatus(req, res) {
    try {
      // Check for the special marker document in Allotment collection
      const currentSessionMarker = await AddAllotment.findOne(
        { session: '__CURRENT_SESSION_MARKER__' }, 
        { currentSessionValue: 1 }
      );
      
      console.log(' Fetched current session marker:', currentSessionMarker);
      
      if (currentSessionMarker && currentSessionMarker.currentSessionValue) {
        console.log(' Returning current session:', currentSessionMarker.currentSessionValue);
        return res.status(200).json({ currentSession: currentSessionMarker.currentSessionValue });
      }
      
      console.log(' No marker found, checking TimeTable...');
      // Fallback to TimeTable for backwards compatibility
      const currentEntry = await TimeTable.findOne({ currentSession: true }, { session: 1 });
      console.log(' TimeTable current entry:', currentEntry);
      res.status(200).json({ currentSession: currentEntry ? currentEntry.session : null });
    } catch (error) {
      console.error(' Error getting current status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllotmentById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await AddAllotment.findById(id);
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
    try {
      await AddAllotment.findByIdAndUpdate(id, announcement);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await AddAllotment.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateSession(sessionId, newSession){
    if (!sessionId || !newSession) {
      throw new HttpException(400, "Invalid session ID or new session value");
    }
    try {
      const updatedAllotment = await AddAllotment.findOneAndUpdate(
        { session: sessionId },
        { session: newSession },
        { new: true }
      );
      if (!updatedAllotment) {
        throw new HttpException(400, "Session not found");
      }
      return updatedAllotment;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteBySession(session) {
    try {
      if (!session) {
        throw new HttpException(400, "Invalid session");
      }
  
      const deletedDocument = await AddAllotment.findOneAndDelete({ session });
  
      if (!deletedDocument) {
        throw new HttpException(404, "Document not found");
      }

      return deletedDocument;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AllotmentController;
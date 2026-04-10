const express = require("express");
const LockTimeTableRouter = express.Router();
const LockTimeTableController = require("../controllers/locktimetable");
const locktimetableController = new LockTimeTableController();
const protectRoute =require("../../usermanagement/privateroute")

LockTimeTableRouter.post("/locktt",protectRoute, async (req, res) => {
    try { 
      await locktimetableController.locktt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  
  LockTimeTableRouter.get("/lockclasstt/:code/:sem", async (req, res) => {
    try { 
      await locktimetableController.classtt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });



  LockTimeTableRouter.get("/lockfacultytt/:code/:faculty", async (req, res) => {
    try { 
      await locktimetableController.facultytt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  LockTimeTableRouter.get("/lockroomtt/:code/:room", async (req, res) => {
    try { 
      await locktimetableController.roomtt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


// view timetable final

LockTimeTableRouter.get("/viewsem/:degree/:dept/:sem", async (req, res) => {
  try { 
    await locktimetableController.classtt(req, res);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});



LockTimeTableRouter.get("/viewfaculty/:session/:faculty", async (req, res) => {
  try { 
    await locktimetableController.facultytt(req, res);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

LockTimeTableRouter.get("/viewroom/:session/:room", async (req, res) => {
  try { 
    await locktimetableController.roomtt(req, res);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});



LockTimeTableRouter.get("/viewsem/:code", async (req, res) => {
  try { 
    const code=req.params.code;
   const updatedTime= await locktimetableController.getLastUpdatedTimeByCode(code);
   res.json({updatedTime})
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

LockTimeTableRouter.delete("/deletebycode/:code",protectRoute, async (req, res) => {
  try {
    const code = req.params.code;
    await locktimetableController.deleteLockedTableByCode(code);
    res.status(200).json({ response: `Locked Time Table with code ${code} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// ─── Attendance lookup: room + slot → batch/subject/faculty/sem/dept ───
const LockSem = require('../../../models/locksem');
const TimeTable = require('../../../models/timetable');

LockTimeTableRouter.get('/attendance-lookup', async (req, res) => {
    try {
        const { room, slot } = req.query;
        if (!room || !slot) {
            return res.status(400).json({ error: 'room and slot are required' });
        }

        // Try with currentSession=true first
        let records = await LockSem.aggregate([
            {
                $match: {
                    slot: { $regex: new RegExp(`^${slot}$`, 'i') },
                    'slotData.room': { $regex: new RegExp(`^${room}$`, 'i') },
                }
            },
            {
                $lookup: {
                    from:         'timetables',
                    localField:   'timetable',
                    foreignField: '_id',
                    as:           'timetableData',
                }
            },
            { $unwind: { path: '$timetableData', preserveNullAndEmptyArrays: false } },
            { $match: { 'timetableData.currentSession': true } },
            { $limit: 1 }
        ]);

        // Fallback: without currentSession filter
        if (!records.length) {
            records = await LockSem.aggregate([
                {
                    $match: {
                        slot: { $regex: new RegExp(`^${slot}$`, 'i') },
                        'slotData.room': { $regex: new RegExp(`^${room}$`, 'i') },
                    }
                },
                {
                    $lookup: {
                        from:         'timetables',
                        localField:   'timetable',
                        foreignField: '_id',
                        as:           'timetableData',
                    }
                },
                { $unwind: { path: '$timetableData', preserveNullAndEmptyArrays: false } },
                { $limit: 1 }
            ]);
        }

       if (!records.length) {
    // Print ALL unique rooms in LockSem to find correct names
    const allRooms = await LockSem.aggregate([
        { $unwind: '$slotData' },
        { $group: { _id: '$slotData.room' } },
        { $sort: { _id: 1 } }
    ]);
    console.log('=== ALL ROOMS IN LOCKSEM ===');
    console.log(allRooms.map(r => r._id).join('\n'));
    return res.status(404).json({ 
        error: 'No timetable entry found',
        hint: 'Check server console for all available room names'
    });
} 

        const rec       = records[0];
        const tt        = rec.timetableData;
        const slotEntry = rec.slotData.find(
            s => s.room && s.room.toLowerCase() === room.toLowerCase()
        );

        if (!slotEntry) {
            return res.status(404).json({ error: 'Room not found in slot data' });
        }

        // Build batch name
        const session = tt.session || '';
        const sessionStartYear = parseInt(session.split('-')[0]) || new Date().getFullYear();
        const semRaw  = (rec.sem || '').toString();
        const semMatch = semRaw.match(/\d+/);
        const semNum  = semMatch ? parseInt(semMatch[0]) : 0;
        const yearOfStudy = semNum > 0 ? Math.ceil(semNum / 2) : 1;
        const batchYear   = String(sessionStartYear - (yearOfStudy - 1));

        const ttNameUpper = (tt.name || '').toUpperCase();
        let degree = 'BTECH';
        for (const d of ['MTECH', 'PHD', 'BSC', 'MSC', 'MBA', 'MCA', 'BTECH']) {
            if (ttNameUpper.includes(d)) { degree = d; break; }
        }

        const dept  = (tt.dept || '').trim().toUpperCase().replace(/\s+/g, '_');
        const batch = `${degree}_${dept}_${batchYear}`;

        return res.json({
            batch,
            subject:   slotEntry.subject  || '',
            faculty:   slotEntry.faculty  || '',
            sem:       rec.sem            || '',
            dept,
            degree,
            session,
            batchYear,
            locksemId: rec._id.toString(),
        });

    } catch (err) {
        console.error('[attendance-lookup] error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Get all unique rooms in LockSem ───────────────────────────────────
LockTimeTableRouter.get('/rooms', async (req, res) => {
    try {
        const rooms = await LockSem.aggregate([
            { $unwind: '$slotData' },
            { $match: { 'slotData.room': { $exists: true, $ne: '' } } },
            { $group: { _id: '$slotData.room' } },
            { $sort: { _id: 1 } }
        ]);
        res.json({ rooms: rooms.map(r => r._id).filter(Boolean) });
    } catch (err) {
        console.error('[rooms] error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});




  module.exports = LockTimeTableRouter;
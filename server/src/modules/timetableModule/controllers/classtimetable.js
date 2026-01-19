const ClassTable = require("../../../models/classtimetable");
const LockSem = require("../../../models/locksem");
const TimeTable = require("../../../models/timetable");

const HttpException = require("../../../models/http-exception");

const ClassTimeTabledto = require("../dto/classtimetable");
const ClassTimeTableDto = new ClassTimeTabledto();

const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();
const getIndianTime = require("../helper/getIndianTime")

const SubjectController = require('./subjectprofile')
const subjectController = new SubjectController();


class ClassTimeTableController {
 // Controller method
async savett(req, res) {
  const timetableData = req.body.timetableData; // nested object (day -> slot -> [ [cells], [cells], ... ])
  const { code, sem } = req.body;

  // --- helper: clean + dedupe one slot's cells by (subject, room, faculty) ---
  const dedupeSlotData = (cells) => {
    const seen = new Set();
    const cleaned = [];

    for (const item of cells) {
      if (!item || typeof item !== "object") continue;

      // normalize fields (trim + case-insensitive for deduping)
      const subject = (item.subject || "").trim();
      const room    = (item.room    || "").trim();
      const faculty = (item.faculty || "").trim();

      // skip a fully empty row
      if (!subject && !room && !faculty) continue;

      const key = `${subject.toLowerCase()}|${room.toLowerCase()}|${faculty.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        // store trimmed (original case kept as-is, or keep normalized—your call)
        cleaned.push({ subject, room, faculty });
      }
    }
    return cleaned;
  };

  try {
    // Remove prior records for this code/sem so we can insert a clean snapshot
    await ClassTable.deleteMany({ code, sem });

    const bulkOperations = [];
    const timetableObject = await ClassTimeTableDto.findTimeTableIdByCode(code);

    // timetableData: { Monday: { period1: [ [cells], [cells] ... ], lunch: [...] }, Tuesday: ... }
    for (const [day, dayData] of Object.entries(timetableData || {})) {
      for (const [slot, slotDataArray] of Object.entries(dayData || {})) {
        // Flatten all groups in the slot to a single list of cells, then dedupe
        // - use flat(2) to be robust against nesting depth
        const rawCells = Array.isArray(slotDataArray) ? slotDataArray.flat(2) : [];
        const slotData = dedupeSlotData(rawCells);

        // You may choose to always insert a doc (even if slotData is empty),
        // or skip empty ones. Keeping parity with your current shape, we insert.
        bulkOperations.push({
          insertOne: {
            document: { day, slot, slotData, code, sem, timetable: timetableObject },
          },
        });
      }
    }

    if (bulkOperations.length > 0) {
      await ClassTable.bulkWrite(bulkOperations);
    }

    res.status(200).json({ message: "Previous data deleted, new data inserted successfully (duplicates removed)." });
  } catch (error) {
    console.error("Error saving timetable:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * HELPER: Build subject and faculty to department mappings for the session
 * Maps each subject/faculty name to which department code owns it
 */
async buildDepartmentMappings(session) {
  const subjectToDeptMap = {};
  const facultyToDeptMap = {};
  
  try {
    // Get all department codes in this session
    const codes = await TimeTableDto.getAllCodesOfSession(session);
    
    // Fetch all timetable records for the session
    const allRecords = await ClassTable.find({ 
      code: { $in: codes } 
    }).lean();
    
    // Map each subject and faculty to its owning department
    for (const record of allRecords) {
      if (record.slotData && Array.isArray(record.slotData)) {
        for (const slotItem of record.slotData) {
          // Map subject to department
          if (slotItem.subject) {
            const normalizedSubject = slotItem.subject.trim().toLowerCase();
            if (!subjectToDeptMap[normalizedSubject]) {
              subjectToDeptMap[normalizedSubject] = record.code;
            }
          }
          
          // Map faculty to department(s) - faculty can teach in multiple depts
          if (slotItem.faculty) {
            const normalizedFaculty = slotItem.faculty.trim().toLowerCase();
            if (!facultyToDeptMap[normalizedFaculty]) {
              facultyToDeptMap[normalizedFaculty] = new Set();
            }
            facultyToDeptMap[normalizedFaculty].add(record.code);
          }
        }
      }
    }
    
    return { subjectToDeptMap, facultyToDeptMap };
  } catch (error) {
    console.error("Error building department mappings:", error);
    return { subjectToDeptMap: {}, facultyToDeptMap: {} };
  }
}

/**
 * Returns true if EITHER subject OR faculty belongs to current department
 */
isFalsePositiveRoomConflict(conflictRecord, currentCode, currentSubject, currentFaculty, subjectToDeptMap, facultyToDeptMap) {
  try {
    // If it's the same department, not a conflict
    if (conflictRecord.code === currentCode) {
      return true;
    }
    
    // Check each item in the conflicting slot
    if (conflictRecord.slotData && Array.isArray(conflictRecord.slotData)) {
      for (const slotItem of conflictRecord.slotData) {
        
        // Check 1: Does the SUBJECT belong to current department?
        if (slotItem.subject) {
          const normalizedSubject = slotItem.subject.trim().toLowerCase();
          const subjectOwnerDept = subjectToDeptMap[normalizedSubject];
          
          if (subjectOwnerDept === currentCode) {
            console.log(`✓ Room conflict is FALSE POSITIVE: Subject "${slotItem.subject}" belongs to current dept`);
            return true; // Subject belongs to current dept - NOT a real clash
          }
        }
        
        // Check 2: Does the FACULTY belong to current department?
        if (slotItem.faculty) {
          const normalizedFaculty = slotItem.faculty.trim().toLowerCase();
          const facultyDepts = facultyToDeptMap[normalizedFaculty];
          
          if (facultyDepts && facultyDepts.has(currentCode)) {
            console.log(`✓ Room conflict is FALSE POSITIVE: Faculty "${slotItem.faculty}" belongs to current dept`);
            return true; // Faculty belongs to current dept - NOT a real clash
          }
        }
      }
    }
    
    return false; // Real conflict
  } catch (error) {
    console.error("Error checking false positive:", error);
    return false;
  }
}

/**
 * IMPROVED HELPER: Check if a faculty conflict is a FALSE POSITIVE
 * Returns true if EITHER:
 * 1. Same faculty teaching same subject for same dept (different sections)
 * 2. Faculty or subject belongs to current department
 */
isFalsePositiveFacultyConflict(conflictRecord, currentCode, currentSubject, currentFaculty, subjectToDeptMap, facultyToDeptMap) {
  try {
    // If it's the same department, not a conflict
    if (conflictRecord.code === currentCode) {
      return true;
    }
    
    const normalizedCurrentSubject = (currentSubject || "").trim().toLowerCase();
    const normalizedCurrentFaculty = (currentFaculty || "").trim().toLowerCase();
    
    // Check faculty teaching in the conflicting slot
    if (conflictRecord.slotData && Array.isArray(conflictRecord.slotData)) {
      for (const slotItem of conflictRecord.slotData) {
        
        // Only check items with the same faculty
        if (slotItem.faculty && slotItem.faculty.trim().toLowerCase() === normalizedCurrentFaculty) {
          
          // Check 1: Is it the SAME SUBJECT being taught?
          if (slotItem.subject) {
            const normalizedConflictSubject = slotItem.subject.trim().toLowerCase();
            
            if (normalizedCurrentSubject === normalizedConflictSubject) {
              const subjectOwnerDept = subjectToDeptMap[normalizedConflictSubject];
              
              // If same subject belongs to current dept, it's just different sections
              if (subjectOwnerDept === currentCode) {
                console.log(`✓ Faculty conflict is FALSE POSITIVE: Same subject "${slotItem.subject}" taught in different sections of current dept`);
                return true;
              }
            }
            
            // Check 2: Does the SUBJECT belong to current department?
            const conflictSubjectOwner = subjectToDeptMap[normalizedConflictSubject];
            if (conflictSubjectOwner === currentCode) {
              console.log(`✓ Faculty conflict is FALSE POSITIVE: Subject "${slotItem.subject}" belongs to current dept`);
              return true;
            }
          }
          
          // Check 3: Does the FACULTY primarily belong to current department?
          const facultyDepts = facultyToDeptMap[normalizedCurrentFaculty];
          if (facultyDepts && facultyDepts.has(currentCode)) {
            console.log(`✓ Faculty conflict is FALSE POSITIVE: Faculty "${currentFaculty}" belongs to current dept`);
            return true;
          }
        }
      }
    }
    
    return false; // Real conflict
  } catch (error) {
    console.error("Error checking false positive faculty:", error);
    return false;
  }
}
 
async saveslot(req, res) {
  const day = req.params.day;
  const slot = req.params.slot;
  const slotData = req.body.slotData;
  const code = req.body.code;
  const sem = req.body.sem;
  
  try {
    const session = await TimeTableDto.getSessionByCode(code);
    
    // IMPROVED: Build both subject and faculty mappings
    const { subjectToDeptMap, facultyToDeptMap } = await this.buildDepartmentMappings(session);
    
    let isSlotAvailable = true;
    const unavailableItems = [];

    for (const slotItem of slotData) {
      // Check room clashes
      if (slotItem.room) {
        const roomSlots = await ClassTimeTableDto.findRoomDataWithSession(session, slotItem.room);
        
        // IMPROVED: Filter with both subject and faculty checks
        const realRoomConflicts = roomSlots.filter(record => {
          // Check if this is in the same time slot
          if (record.day !== day || record.slot !== slot) return false;
          
          // Check if it's a false positive (subject OR faculty belongs to current dept)
          return !this.isFalsePositiveRoomConflict(
            record, 
            code, 
            slotItem.subject,
            slotItem.faculty,
            subjectToDeptMap,
            facultyToDeptMap
          );
        });
        
        const isRoomAvailable = realRoomConflicts.length === 0;
        
        if (!isRoomAvailable) {
          isSlotAvailable = false;
          unavailableItems.push({ 
            item: slotItem, 
            reason: "room",
            details: "Room is occupied by another department's class"
          });
        }
      }
      
      // Check faculty clashes
      if (slotItem.faculty) {
        const facultySlots = await ClassTimeTableDto.findFacultyDataWithSession(session, slotItem.faculty);
        
        // IMPROVED: Filter with both subject and faculty checks
        const realFacultyConflicts = facultySlots.filter(record => {
          // Check if this is in the same time slot
          if (record.day !== day || record.slot !== slot) return false;
          
          // Check if it's a false positive
          return !this.isFalsePositiveFacultyConflict(
            record, 
            code, 
            slotItem.subject, 
            slotItem.faculty,
            subjectToDeptMap,
            facultyToDeptMap
          );
        });
        
        const isFacultyAvailable = realFacultyConflicts.length === 0;
        
        if (!isFacultyAvailable) {
          isSlotAvailable = false;
          unavailableItems.push({ 
            item: slotItem, 
            reason: "faculty",
            details: "Faculty is teaching in another department at this time"
          });
        }
      }
    }
    
    if (isSlotAvailable) {
      res.status(200).json({ message: "Slot is available" });
    } else {
      res.status(200).json({
        message: "Slot is not available. Check faculty and room availability for more details",
        unavailableItems,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}


async savelunchslot(req, res) {
  const code = req.body.code;
  const sem = req.body.selectedSemester;
  const lunchData = req.body.lunchData;

  try {
    for (const lunchItem of lunchData) {
      const { day, slot, slotData } = lunchItem;

      const query = {
        day,
        slot,
        code,
        sem,
      };

      const existingRecord = await ClassTable.findOne(query);

      if (existingRecord) {
        // If a record already exists, update it with the new slotData
        existingRecord.slotData = slotData;
        await existingRecord.save();
        // console.log(`Updated class table data for ${day} - ${slot}`);
      } else {
        // If no record exists, create a new one with the slotData
        const timetableObject = await ClassTimeTableDto.findTimeTableIdByCode(code);
        const classTableInstance = new ClassTable({
          day,
          slot,
          slotData,
          code,
          sem,
          timetable: timetableObject,
        });
        await classTableInstance.save();
        // console.log(`Saved class table data for ${day} - ${slot}`);
      }
    }

    const lunchrecords = await ClassTable.find({ slot: 'lunch', code, 'slotData.0': { $exists: true } });
    res.status(200).json({ lunchrecords });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async getlunchslot(req, res) {
  try {
    const code = req.params.code;
    const lunchrecords = await ClassTable.find({slot:'lunch',code, 'slotData.0': { $exists: true }});
    // console.log(lunchrecords)
    res.status(200).json({lunchrecords})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async deletelunchslot(req, res) {
  const id=req.params.id
  if (!id) {
    throw new HttpException(400, "Invalid Id");
  }
  try {
    const deletedata=await ClassTable.findById(id)
    const query={
      sem:deletedata.sem,
      day:deletedata.day,
      slot:'lunch'
    }
    await LockSem.deleteOne(query);
    await ClassTable.findByIdAndDelete(id);

  } catch (e) {
    throw new HttpException(500, e.message || "Internal Server Error");
  }
}

  async classtt(req, res) {
    try {
      const sem = req.params.sem;
      const code = req.params.code;
  
      // Query the database to find records that match the sem and code
      const records = await ClassTable.find({ sem, code });
  
      // Create an empty timetable data object
      const timetableData = {};
  
      // Iterate through the records and format the data
      records.forEach((record) => {
        // Extract relevant data from the record
        const { day, slot, slotData } = record;
  
        // Create or initialize the day in the timetableData
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
  
        // Create or initialize the slot in the day
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
  
        // Access the "slotData" array and push its values
     // Access the "slotData" array and push its values
     const formattedSlotData = slotData.map(({ subject, faculty, room }) => ({
      subject,
      faculty,
      room,
    }));

    timetableData[day][slot].push(formattedSlotData);
        // Set the sem and code for the timetable
        timetableData.sem = sem;
        timetableData.code = code;
      });
  
      res.status(200).json(timetableData);
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching and formatting data from the database');
    }
  }
  

  async facultytt(req, res) {
    const facultyname = req.params.facultyname; 
    const code=req.params.code;
    // console.log('facultyname:', facultyname);
    try {
      // Query the ClassTable collection based on the 'faculty' field
      // const facultydata = await ClassTable.find({ faculty: facultyname });
      const session = await TimeTableDto.getSessionByCode(code);
      const records = await ClassTimeTableDto.findFacultyDataWithSession(session,facultyname);
      // console.log(records)
      const updatedTime= await ClassTimeTableDto.getLastUpdatedTime(records);
      // const subjects = await subjectController.getSubjectBySession(code);
   
      // Create an empty timetable data object
      const timetableData = {};
  
      // Iterate through the records and format the data
      records.forEach((record) => {
        // Extract relevant data from the record
        const { day, slot, slotData,sem } = record;
  
        // Create or initialize the day in the timetableData
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
  
        // Create or initialize the slot in the day
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
   // Iterate through the slotData array and filter based on faculty name
   const matchingSlotData = slotData.filter((slotItem) => slotItem.faculty === facultyname);

   // Access the matching values from the filtered slotData and push them
   const formattedSlotData = matchingSlotData.map(({ subject, room }) => ({
       subject,
       sem,
       room,
   }));

    timetableData[day][slot].push(formattedSlotData);
        // Set the sem and code for the timetable
      });
      // console.log(timetableData)
      res.status(200).json({timetableData, updatedTime});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  
  async roomtt(req, res) {
    const roomno = req.params.room; 
    const code=req.params.code;
    // console.log('room no:', roomno);
    try {
      const session = await TimeTableDto.getSessionByCode(code);
      const records = await ClassTimeTableDto.findRoomDataWithSession(session,roomno);
      const updatedTime= await ClassTimeTableDto.getLastUpdatedTime(records);
      const timetableData = {};
      records.forEach((record) => {
      const { day, slot, slotData,sem } = record;
        if (!timetableData[day]) {
          timetableData[day] = {};
        }
        if (!timetableData[day][slot]) {
          timetableData[day][slot] = [];
        }
   
   // Iterate through the slotData array and filter based on faculty name
   const matchingSlotData = slotData.filter((slotItem) => slotItem.room === roomno);
 
  const formattedSlotData = matchingSlotData.map(({ subject, faculty }) => ({
      subject,
      faculty,    
      sem,
    }));

    timetableData[day][slot].push(formattedSlotData);
        // Set the sem and code for the timetable
      });
      // console.log('rooom data',timetableData)
      res.status(200).json({timetableData,updatedTime});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteClassTableByCode(code) {
    try {

      await ClassTable.deleteMany({ code });

    } catch (error) {
      throw new Error("Failed to delete by code");
    }
  }



}
module.exports = ClassTimeTableController;
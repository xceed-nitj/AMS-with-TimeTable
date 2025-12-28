const LockSem = require("../../../models/locksem"); // Changed from ClassTable
const TimeTable = require("../../../models/timetable");
const LockTimeTabledto = require("../dto/locktimetable"); // Changed from ClassTimeTabledto
const LockTimeTableDto = new LockTimeTabledto();
const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();

class AdminClashController {
  /**
   * Get all clashes across all departments in a session (OPTIMIZED - Using Locked Data)
   * @route GET /timetablemodule/adminclash/:session
   */
  async getAllClashes(req, res) {
    try {
      const session = req.params.session;
      console.log('Getting clashes for session:', session);

      // Check if mongoose is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.error('Database connection state:', mongoose.connection.readyState);
        return res.status(500).json({ 
          error: "Database connection is not established",
          message: "Please wait for the database to reconnect and try again."
        });
      }

      // Get all department codes for this session
      const codes = await TimeTableDto.getAllCodesOfSession(session);
      console.log('Found department codes:', codes);

      if (!codes || codes.length === 0) {
        return res.status(200).json({
          message: "No departments found for this session",
          session,
          totalDepartments: 0,
          departmentsWithClashes: 0,
          clashes: {},
        });
      }

      // OPTIMIZATION: Fetch ALL locked timetable records for the session at once
      const allRecords = await LockSem.find({ 
        code: { $in: codes } 
      }).lean();
      
      console.log(`Fetched ${allRecords.length} locked records for ${codes.length} departments`);

      // OPTIMIZATION: Build lookup maps for quick access
      const roomMap = this.buildRoomMap(allRecords);
      const facultyMap = this.buildFacultyMap(allRecords);
      const deptRecordsMap = this.groupRecordsByDept(allRecords);

      // OPTIMIZATION: Fetch all department details at once
      const deptDetailsPromises = codes.map(code => 
        TimeTableDto.getTTdetailsByCode(code).catch(err => {
          console.error(`Error fetching details for ${code}:`, err);
          return null;
        })
      );
      const deptDetailsArray = await Promise.all(deptDetailsPromises);
      const deptDetailsMap = {};
      codes.forEach((code, idx) => {
        const details = deptDetailsArray[idx];
        deptDetailsMap[code] = {
          name: details?.dept || details?.department || code,
          code: code
        };
      });

      const allClashes = {};

      // Process each department using pre-loaded data
      for (const code of codes) {
        const departmentClashes = this.findClashesForDepartmentOptimized(
          code,
          deptRecordsMap[code] || [],
          roomMap,
          facultyMap,
          deptDetailsMap
        );

        if (departmentClashes.length > 0) {
          const departmentName = deptDetailsMap[code]?.name || code;
          
          console.log(`Department ${code}: name="${departmentName}"`);
          
          allClashes[code] = {
            department: departmentName,
            session: session,
            code: code,
            clashes: departmentClashes,
          };
        }
      }

      console.log(`Total departments with clashes: ${Object.keys(allClashes).length}`);

      res.status(200).json({
        session,
        totalDepartments: codes.length,
        departmentsWithClashes: Object.keys(allClashes).length,
        clashes: allClashes,
      });
    } catch (error) {
      console.error("Error getting all clashes:", error);
      
      // Check if it's a MongoDB connection error
      if (error.name === 'MongoNetworkError' || error.message.includes('ETIMEDOUT')) {
        return res.status(503).json({ 
          error: "Database connection timeout",
          message: "The database is temporarily unavailable. Please try again in a moment."
        });
      }
      
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  }

  /**
   * Build a map of rooms to their slot assignments
   * Key: "room|day|slot"
   * Value: Array of records using that room at that time
   */
  buildRoomMap(records) {
    const map = {};
    
    for (const record of records) {
      const { day, slot, slotData, code, sem } = record;
      
      if (!slotData || slotData.length === 0) continue;
      
      for (const slotItem of slotData) {
        if (!slotItem.room) continue;
        
        const key = `${slotItem.room}|${day}|${slot}`;
        if (!map[key]) {
          map[key] = [];
        }
        
        map[key].push({
          code,
          sem,
          subject: slotItem.subject,
          faculty: slotItem.faculty,
          room: slotItem.room,
        });
      }
    }
    
    return map;
  }

  /**
   * Build a map of faculty to their slot assignments
   * Key: "faculty|day|slot"
   * Value: Array of records with that faculty at that time
   */
  buildFacultyMap(records) {
    const map = {};
    
    for (const record of records) {
      const { day, slot, slotData, code, sem } = record;
      
      if (!slotData || slotData.length === 0) continue;
      
      for (const slotItem of slotData) {
        if (!slotItem.faculty) continue;
        
        const key = `${slotItem.faculty}|${day}|${slot}`;
        if (!map[key]) {
          map[key] = [];
        }
        
        map[key].push({
          code,
          sem,
          subject: slotItem.subject,
          faculty: slotItem.faculty,
          room: slotItem.room,
        });
      }
    }
    
    return map;
  }

  /**
   * Group records by department code
   */
  groupRecordsByDept(records) {
    const map = {};
    
    for (const record of records) {
      if (!map[record.code]) {
        map[record.code] = [];
      }
      map[record.code].push(record);
    }
    
    return map;
  }

  /**
   * Find clashes using pre-built maps (no database queries)
   */
  findClashesForDepartmentOptimized(code, deptRecords, roomMap, facultyMap, deptDetailsMap) {
    const clashes = [];
    const seenClashes = new Set(); // Prevent duplicate clash reporting

    for (const record of deptRecords) {
      const { day, slot, slotData, sem } = record;

      if (!slotData || slotData.length === 0) continue;

      for (const slotItem of slotData) {
        // Check room clashes
        if (slotItem.room) {
          const roomKey = `${slotItem.room}|${day}|${slot}`;
          const roomConflicts = roomMap[roomKey] || [];
          
          const conflicts = roomConflicts
            .filter(r => r.code !== code)
            .map(conflict => ({
              code: conflict.code,
              department: deptDetailsMap?.[conflict.code]?.name || conflict.code,
              sem: conflict.sem,
              subject: conflict.subject,
              faculty: conflict.faculty,
              room: conflict.room
            }));
          
          if (conflicts.length > 0) {
            const clashKey = `room|${day}|${slot}|${sem}|${slotItem.room}`;
            if (!seenClashes.has(clashKey)) {
              seenClashes.add(clashKey);
              clashes.push({
                type: "room",
                day,
                slot,
                sem,
                room: slotItem.room,
                subject: slotItem.subject,
                faculty: slotItem.faculty,
                conflictsWith: conflicts,
              });
            }
          }
        }

        // Check faculty clashes
        if (slotItem.faculty) {
          const facultyKey = `${slotItem.faculty}|${day}|${slot}`;
          const facultyConflicts = facultyMap[facultyKey] || [];
          
          const conflicts = facultyConflicts
            .filter(r => r.code !== code)
            .map(conflict => ({
              code: conflict.code,
              department: deptDetailsMap?.[conflict.code]?.name || conflict.code,
              sem: conflict.sem,
              subject: conflict.subject,
              faculty: conflict.faculty,
              room: conflict.room
            }));
          
          if (conflicts.length > 0) {
            const clashKey = `faculty|${day}|${slot}|${sem}|${slotItem.faculty}`;
            if (!seenClashes.has(clashKey)) {
              seenClashes.add(clashKey);
              clashes.push({
                type: "faculty",
                day,
                slot,
                sem,
                faculty: slotItem.faculty,
                subject: slotItem.subject,
                room: slotItem.room,
                conflictsWith: conflicts,
              });
            }
          }
        }
      }
    }

    return clashes;
  }

  /**
   * Get clashes for a specific department (OPTIMIZED - Using Locked Data)
   * @route GET /timetablemodule/adminclash/department/:code
   */
  async getDepartmentClashes(req, res) {
    try {
      const code = req.params.code;
      const session = await TimeTableDto.getSessionByCode(code);

      if (!session) {
        return res.status(404).json({ error: "Department not found" });
      }

      // Get all codes for the session
      const codes = await TimeTableDto.getAllCodesOfSession(session);
      
      // Fetch all locked records for the session at once
      const allRecords = await LockSem.find({ 
        code: { $in: codes } 
      }).lean();
      
      // Build maps
      const roomMap = this.buildRoomMap(allRecords);
      const facultyMap = this.buildFacultyMap(allRecords);
      const deptRecordsMap = this.groupRecordsByDept(allRecords);
      
      // Fetch department details for all codes
      const deptDetailsPromises = codes.map(c => 
        TimeTableDto.getTTdetailsByCode(c).catch(err => {
          console.error(`Error fetching details for ${c}:`, err);
          return null;
        })
      );
      const deptDetailsArray = await Promise.all(deptDetailsPromises);
      const deptDetailsMap = {};
      codes.forEach((c, idx) => {
        const details = deptDetailsArray[idx];
        deptDetailsMap[c] = {
          name: details?.dept || details?.department || c,
          code: c
        };
      });
      
      // Find clashes for this specific department
      const clashes = this.findClashesForDepartmentOptimized(
        code,
        deptRecordsMap[code] || [],
        roomMap,
        facultyMap,
        deptDetailsMap
      );
      
      const departmentName = deptDetailsMap[code]?.name || code;

      res.status(200).json({
        department: departmentName,
        code,
        session,
        totalClashes: clashes.length,
        clashes,
      });
    } catch (error) {
      console.error("Error getting department clashes:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }

  /**
   * LEGACY METHOD - kept for backwards compatibility
   * Use findClashesForDepartmentOptimized instead
   */
  async findClashesForDepartment(code, session) {
    try {
      const clashes = [];
      const deptRecords = await LockSem.find({ code }).lean();

      for (const record of deptRecords) {
        const { day, slot, slotData, sem } = record;
        if (!slotData || slotData.length === 0) continue;

        for (const slotItem of slotData) {
          if (slotItem.room) {
            const roomClash = await this.checkRoomClash(
              session, day, slot, slotItem.room, sem, code
            );
            if (roomClash) {
              clashes.push({
                type: "room", day, slot, sem,
                room: slotItem.room,
                subject: slotItem.subject,
                faculty: slotItem.faculty,
                conflictsWith: roomClash,
              });
            }
          }

          if (slotItem.faculty) {
            const facultyClash = await this.checkFacultyClash(
              session, day, slot, slotItem.faculty, sem, code
            );
            if (facultyClash) {
              clashes.push({
                type: "faculty", day, slot, sem,
                faculty: slotItem.faculty,
                subject: slotItem.subject,
                room: slotItem.room,
                conflictsWith: facultyClash,
              });
            }
          }
        }
      }

      return clashes;
    } catch (error) {
      console.error(`Error finding clashes for department ${code}:`, error);
      throw error;
    }
  }

  async checkRoomClash(session, day, slot, room, sem, currentCode) {
    try {
      const roomSlots = await LockTimeTableDto.findRoomDataWithSession(session, room);
      const conflicts = [];

      for (const record of roomSlots) {
        if (record.day === day && record.slot === slot && record.code !== currentCode) {
          const slotItem = record.slotData.find((s) => s.room === room);
          conflicts.push({
            code: record.code,
            sem: record.sem,
            subject: slotItem?.subject,
            faculty: slotItem?.faculty,
          });
        }
      }

      return conflicts.length > 0 ? conflicts : null;
    } catch (error) {
      console.error("Error checking room clash:", error);
      return null;
    }
  }

  async checkFacultyClash(session, day, slot, faculty, sem, currentCode) {
    try {
      const facultySlots = await LockTimeTableDto.findFacultyDataWithSession(session, faculty);
      const conflicts = [];

      for (const record of facultySlots) {
        if (record.day === day && record.slot === slot && record.code !== currentCode) {
          const slotItem = record.slotData.find((s) => s.faculty === faculty);
          conflicts.push({
            code: record.code,
            sem: record.sem,
            subject: slotItem?.subject,
            room: slotItem?.room,
          });
        }
      }

      return conflicts.length > 0 ? conflicts : null;
    } catch (error) {
      console.error("Error checking faculty clash:", error);
      return null;
    }
  }

  /**
   * Get clash summary statistics (OPTIMIZED - Using Locked Data)
   * @route GET /timetablemodule/adminclash/:session/summary
   */
  async getClashSummary(req, res) {
    try {
      const session = req.params.session;
      const codes = await TimeTableDto.getAllCodesOfSession(session);

      // Fetch all locked records at once
      const allRecords = await LockSem.find({ 
        code: { $in: codes } 
      }).lean();
      
      // Build maps
      const roomMap = this.buildRoomMap(allRecords);
      const facultyMap = this.buildFacultyMap(allRecords);
      const deptRecordsMap = this.groupRecordsByDept(allRecords);

      // Fetch all department details at once
      const deptDetailsPromises = codes.map(code => 
        TimeTableDto.getTTdetailsByCode(code).catch(err => {
          console.error(`Error fetching details for ${code}:`, err);
          return null;
        })
      );
      const deptDetailsArray = await Promise.all(deptDetailsPromises);
      const deptDetailsMap = {};
      codes.forEach((code, idx) => {
        const details = deptDetailsArray[idx];
        deptDetailsMap[code] = {
          name: details?.dept || details?.department || code,
          code: code
        };
      });

      const summary = {
        session,
        totalDepartments: codes.length,
        departmentStats: [],
        totalClashes: 0,
        roomClashes: 0,
        facultyClashes: 0,
      };

      codes.forEach((code) => {
        const clashes = this.findClashesForDepartmentOptimized(
          code,
          deptRecordsMap[code] || [],
          roomMap,
          facultyMap,
          deptDetailsMap
        );
        
        const departmentName = deptDetailsMap[code]?.name || code;
        const roomClashCount = clashes.filter(c => c.type === "room").length;
        const facultyClashCount = clashes.filter(c => c.type === "faculty").length;

        summary.departmentStats.push({
          code,
          department: departmentName,
          totalClashes: clashes.length,
          roomClashes: roomClashCount,
          facultyClashes: facultyClashCount,
        });

        summary.totalClashes += clashes.length;
        summary.roomClashes += roomClashCount;
        summary.facultyClashes += facultyClashCount;
      });

      res.status(200).json(summary);
    } catch (error) {
      console.error("Error getting clash summary:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }
}

module.exports = AdminClashController;
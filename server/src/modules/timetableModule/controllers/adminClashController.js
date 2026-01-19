const LockSem = require("../../../models/locksem");
const TimeTable = require("../../../models/timetable");
const LockTimeTabledto = require("../dto/locktimetable");
const LockTimeTableDto = new LockTimeTabledto();
const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();

class AdminClashController {
  async getAllClashes(req, res) {
    try {
      const session = req.params.session;
      console.log('Getting clashes for session:', session);

      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.error('Database connection state:', mongoose.connection.readyState);
        return res.status(500).json({ 
          error: "Database connection is not established",
          message: "Please wait for the database to reconnect and try again."
        });
      }

      const codes = await TimeTableDto.getAllCodesOfSession(session);
      console.log('Found department codes:', codes);

      if (!codes || codes.length === 0) {
        return res.status(200).json({
          message: "No departments found for this session",
          session,
          totalDepartments: 0,
          departmentsWithClashes: 0,
          departmentsNeedingAttention: 0,
          clashes: {},
          needsAttention: {},
        });
      }

      const allRecords = await LockSem.find({ 
        code: { $in: codes } 
      }).lean();
      
      console.log(`Fetched ${allRecords.length} locked records for ${codes.length} departments`);

      const roomMap = this.buildRoomMap(allRecords);
      const facultyMap = this.buildFacultyMap(allRecords);
      const subjectFacultyMap = this.buildSubjectFacultyMap(allRecords);
      const deptRecordsMap = this.groupRecordsByDept(allRecords);

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
      const allNeedsAttention = {};

      for (const code of codes) {
        const { clashes: departmentClashes, needsAttention } = this.findClashesForDepartmentOptimized(
          code,
          deptRecordsMap[code] || [],
          roomMap,
          facultyMap,
          subjectFacultyMap,
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

        if (needsAttention.length > 0) {
          const departmentName = deptDetailsMap[code]?.name || code;
          
          allNeedsAttention[code] = {
            department: departmentName,
            session: session,
            code: code,
            incompleteSlots: needsAttention,
          };
        }
      }

      console.log(`Total departments with clashes: ${Object.keys(allClashes).length}`);
      console.log(`Total departments needing attention: ${Object.keys(allNeedsAttention).length}`);

      res.status(200).json({
        session,
        totalDepartments: codes.length,
        departmentsWithClashes: Object.keys(allClashes).length,
        departmentsNeedingAttention: Object.keys(allNeedsAttention).length,
        clashes: allClashes,
        needsAttention: allNeedsAttention,
      });
    } catch (error) {
      console.error("Error getting all clashes:", error);
      
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

  buildSubjectFacultyMap(records) {
    const map = {};
    
    for (const record of records) {
      const { day, slot, slotData, code, sem } = record;
      
      if (!slotData || slotData.length === 0) continue;
      
      for (const slotItem of slotData) {
        if (!slotItem.subject || !slotItem.faculty) continue;
        
        const normalizedSubject = slotItem.subject.trim().toLowerCase();
        const normalizedFaculty = slotItem.faculty.trim().toLowerCase();
        
        const key = `${normalizedSubject}|${normalizedFaculty}|${day}|${slot}`;
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

  findClashesForDepartmentOptimized(code, deptRecords, roomMap, facultyMap, subjectFacultyMap, deptDetailsMap) {
    const clashes = [];
    const needsAttention = [];
    const seenClashes = new Set();
    const seenIncomplete = new Set();

    for (const record of deptRecords) {
      const { day, slot, slotData, sem } = record;

      if (!slotData || slotData.length === 0) continue;

      // NEW: Check for internal department clashes (same slot has multiple entries)
      if (slotData.length > 1) {
        const facultyInSlot = {};
        const roomsInSlot = {};
        
        for (const slotItem of slotData) {
          // Track faculty usage in this slot
          if (slotItem.faculty && slotItem.faculty.trim() !== '') {
            if (!facultyInSlot[slotItem.faculty]) {
              facultyInSlot[slotItem.faculty] = [];
            }
            facultyInSlot[slotItem.faculty].push({
              subject: slotItem.subject,
              room: slotItem.room,
            });
          }
          
          // Track room usage in this slot
          if (slotItem.room && slotItem.room.trim() !== '') {
            if (!roomsInSlot[slotItem.room]) {
              roomsInSlot[slotItem.room] = [];
            }
            roomsInSlot[slotItem.room].push({
              subject: slotItem.subject,
              faculty: slotItem.faculty,
            });
          }
        }
        
        // Check if same faculty in multiple rooms (internal clash)
        for (const [faculty, assignments] of Object.entries(facultyInSlot)) {
          if (assignments.length > 1) {
            const clashKey = `internal-faculty|${day}|${slot}|${sem}|${faculty}`;
            if (!seenClashes.has(clashKey)) {
              seenClashes.add(clashKey);
              clashes.push({
                type: "internal_faculty",
                day,
                slot,
                sem,
                faculty,
                issue: `Same faculty assigned to ${assignments.length} different rooms in the same slot`,
                assignments: assignments.map((a, idx) => ({
                  subject: a.subject,
                  room: a.room,
                  instance: idx + 1
                }))
              });
            }
          }
        }
        
        // Check if same room with multiple classes (internal clash)
        for (const [room, assignments] of Object.entries(roomsInSlot)) {
          if (assignments.length > 1) {
            const clashKey = `internal-room|${day}|${slot}|${sem}|${room}`;
            if (!seenClashes.has(clashKey)) {
              seenClashes.add(clashKey);
              clashes.push({
                type: "internal_room",
                day,
                slot,
                sem,
                room,
                issue: `Same room assigned ${assignments.length} times in the same slot`,
                assignments: assignments.map((a, idx) => ({
                  subject: a.subject,
                  faculty: a.faculty,
                  instance: idx + 1
                }))
              });
            }
          }
        }
      }

      for (const slotItem of slotData) {
        // Check for incomplete slot assignments (Needs Attention)
        const hasSubject = slotItem.subject && slotItem.subject.trim() !== '';
        const hasFaculty = slotItem.faculty && slotItem.faculty.trim() !== '';
        const hasRoom = slotItem.room && slotItem.room.trim() !== '';
        
        if ((hasSubject || hasFaculty || hasRoom) && !(hasSubject && hasFaculty && hasRoom)) {
          const missingFields = [];
          if (!hasSubject) missingFields.push('subject');
          if (!hasFaculty) missingFields.push('faculty');
          if (!hasRoom) missingFields.push('room');
          
          const incompleteKey = `${day}|${slot}|${sem}|${slotItem.subject || 'no-subject'}|${slotItem.faculty || 'no-faculty'}|${slotItem.room || 'no-room'}`;
          
          if (!seenIncomplete.has(incompleteKey)) {
            seenIncomplete.add(incompleteKey);
            needsAttention.push({
              day,
              slot,
              sem,
              subject: slotItem.subject || null,
              faculty: slotItem.faculty || null,
              room: slotItem.room || null,
              missingFields,
              issue: `Missing: ${missingFields.join(', ')}`
            });
          }
        }

        // Check room clashes (only if room is assigned)
        if (hasRoom) {
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

        // Check faculty clashes (only if faculty is assigned)
        if (hasFaculty) {
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

        // Check subject+faculty clashes (only if both are assigned)
        if (hasSubject && hasFaculty) {
          const normalizedSubject = slotItem.subject.trim().toLowerCase();
          const normalizedFaculty = slotItem.faculty.trim().toLowerCase();
          const subjectFacultyKey = `${normalizedSubject}|${normalizedFaculty}|${day}|${slot}`;
          const subjectFacultyConflicts = subjectFacultyMap[subjectFacultyKey] || [];
          
          const conflicts = subjectFacultyConflicts
            .filter(r => !(r.code === code && r.sem === sem))
            .map(conflict => ({
              code: conflict.code,
              department: deptDetailsMap?.[conflict.code]?.name || conflict.code,
              sem: conflict.sem,
              subject: conflict.subject,
              faculty: conflict.faculty,
              room: conflict.room
            }));
          
          if (conflicts.length > 0) {
            const clashKey = `subject-faculty|${day}|${slot}|${sem}|${normalizedSubject}|${normalizedFaculty}`;
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

    return { clashes, needsAttention };
  }

  async getDepartmentClashes(req, res) {
    try {
      const code = req.params.code;
      const session = await TimeTableDto.getSessionByCode(code);

      if (!session) {
        return res.status(404).json({ error: "Department not found" });
      }

      const codes = await TimeTableDto.getAllCodesOfSession(session);
      
      const allRecords = await LockSem.find({ 
        code: { $in: codes } 
      }).lean();
      
      const roomMap = this.buildRoomMap(allRecords);
      const facultyMap = this.buildFacultyMap(allRecords);
      const subjectFacultyMap = this.buildSubjectFacultyMap(allRecords);
      const deptRecordsMap = this.groupRecordsByDept(allRecords);
      
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
      
      const { clashes, needsAttention } = this.findClashesForDepartmentOptimized(
        code,
        deptRecordsMap[code] || [],
        roomMap,
        facultyMap,
        subjectFacultyMap,
        deptDetailsMap
      );
      
      const departmentName = deptDetailsMap[code]?.name || code;

      res.status(200).json({
        department: departmentName,
        code,
        session,
        totalClashes: clashes.length,
        totalIncompleteSlots: needsAttention.length,
        clashes,
        needsAttention,
      });
    } catch (error) {
      console.error("Error getting department clashes:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }

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

  async getClashSummary(req, res) {
    try {
      const session = req.params.session;
      const codes = await TimeTableDto.getAllCodesOfSession(session);

      const allRecords = await LockSem.find({ 
        code: { $in: codes } 
      }).lean();
      
      const roomMap = this.buildRoomMap(allRecords);
      const facultyMap = this.buildFacultyMap(allRecords);
      const subjectFacultyMap = this.buildSubjectFacultyMap(allRecords);
      const deptRecordsMap = this.groupRecordsByDept(allRecords);

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
        internalClashes: 0,
        totalIncompleteSlots: 0,
      };

      codes.forEach((code) => {
        const { clashes, needsAttention } = this.findClashesForDepartmentOptimized(
          code,
          deptRecordsMap[code] || [],
          roomMap,
          facultyMap,
          subjectFacultyMap,
          deptDetailsMap
        );
        
        const departmentName = deptDetailsMap[code]?.name || code;
        const roomClashCount = clashes.filter(c => c.type === "room").length;
        const facultyClashCount = clashes.filter(c => c.type === "faculty").length;
        const internalClashCount = clashes.filter(c => c.type === "internal_faculty" || c.type === "internal_room").length;

        summary.departmentStats.push({
          code,
          department: departmentName,
          totalClashes: clashes.length,
          roomClashes: roomClashCount,
          facultyClashes: facultyClashCount,
          internalClashes: internalClashCount,
          incompleteSlots: needsAttention.length,
        });

        summary.totalClashes += clashes.length;
        summary.roomClashes += roomClashCount;
        summary.facultyClashes += facultyClashCount;
        summary.internalClashes += internalClashCount;
        summary.totalIncompleteSlots += needsAttention.length;
      });

      res.status(200).json(summary);
    } catch (error) {
      console.error("Error getting clash summary:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }
}

module.exports = AdminClashController;
jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");
jest.mock("../../src/modules/attendanceModule/controllers/alertNotifier");

const axios = require("axios");
const alertNotifier = require("../../src/modules/attendanceModule/controllers/alertNotifier");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { checkMissedClasses } = require("../../src/modules/attendanceModule/controllers/autoAttendanceScheduler");
const Camera = require("../../src/models/attendanceModule/camera");
const LockSem = require("../../src/models/locksem");
const TimeTable = require("../../src/models/timetable");
const AttendanceReport = require("../../src/models/attendanceReport");
const MasterRoom = require("../../src/models/masterroom");

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(disconnect);

const ROOM = "R101";
const SLOT = "09:00-10:00";
const DATE = "2026-07-09";

async function seedTimetableContext() {
  await MasterRoom.create({ room: ROOM, type: "classroom", building: "Block A" });
  await Camera.create({
    cameraId: "CAM1", roomId: ROOM, building: "Block A", position: "front-left",
    streamUrl: "rtsp://x", protocol: "rtsp", ipAddress: "10.0.0.1", port: 554, isActive: true,
  });
  const tt = await TimeTable.create({ name: "BTECH CSE", dept: "CSE", session: "2026-27", currentSession: true });
  await LockSem.create({
    day: "Thursday",
    slot: SLOT,
    slotData: [{ subject: "DBMS", faculty: "Dr. X", room: ROOM }],
    sem: "5",
    code: "CSE5",
    timetable: tt._id,
  });
}

describe("checkMissedClasses guard branches", () => {
  it("does nothing when there are no enabled cameras/rooms", async () => {
    const config = { includedRooms: [] };
    await checkMissedClasses(SLOT, DATE, config);
    expect(alertNotifier.notifyNoReportSaved).not.toHaveBeenCalled();
    expect(alertNotifier.notifyClassBunk).not.toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe("checkMissedClasses with a resolvable room+slot context", () => {
  it("alerts notifyNoReportSaved when no report was saved for the slot", async () => {
    await seedTimetableContext();
    const config = { includedRooms: [] };

    await checkMissedClasses(SLOT, DATE, config);

    expect(alertNotifier.notifyNoReportSaved).toHaveBeenCalledTimes(1);
    const call = alertNotifier.notifyNoReportSaved.mock.calls[0][0];
    expect(call.dept).toBe("CSE");
    expect(call.subject).toBe("DBMS");
    expect(alertNotifier.notifyClassBunk).not.toHaveBeenCalled();
  });

  it("does not alert when a report with present students already exists", async () => {
    await seedTimetableContext();
    await AttendanceReport.create({
      // resolveContext derives this from session "2026-27" + sem "5":
      // sessionStartYear 2026, yearOfStudy ceil(5/2)=3 -> 2026-(3-1) = 2024.
      batch: "BTECH_CSE_2024",
      department: "CSE",
      date: DATE,
      timeSlot: SLOT,
      finalReport: [{ rollNo: "21CS001", finalStatus: "P" }],
      summary: { totalStudents: 1, present: 1, absent: 0, review: 0, attendancePct: 100 },
    });

    await checkMissedClasses(SLOT, DATE, { includedRooms: [] });

    expect(alertNotifier.notifyNoReportSaved).not.toHaveBeenCalled();
    expect(alertNotifier.notifyClassBunk).not.toHaveBeenCalled();
  });

  it("alerts notifyClassBunk when the saved report has students but all absent", async () => {
    await seedTimetableContext();
    await AttendanceReport.create({
      // resolveContext derives this from session "2026-27" + sem "5":
      // sessionStartYear 2026, yearOfStudy ceil(5/2)=3 -> 2026-(3-1) = 2024.
      batch: "BTECH_CSE_2024",
      department: "CSE",
      date: DATE,
      timeSlot: SLOT,
      finalReport: [{ rollNo: "21CS001", finalStatus: "A" }],
      summary: { totalStudents: 1, present: 0, absent: 1, review: 0, attendancePct: 0 },
    });

    await checkMissedClasses(SLOT, DATE, { includedRooms: [] });

    expect(alertNotifier.notifyClassBunk).toHaveBeenCalledTimes(1);
    expect(alertNotifier.notifyClassBunk.mock.calls[0][0].totalStudents).toBe(1);
    expect(alertNotifier.notifyNoReportSaved).not.toHaveBeenCalled();
  });
});

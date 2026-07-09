const fs = require("fs");
const {
  saveAttendanceDailyData,
  listDailyDataFiles,
  readDailyDataFile,
  DAILY_DATA_DIR,
} = require("../../src/modules/attendanceModule/controllers/attendanceDailyDataSaver");

afterAll(() => {
  fs.rmSync(DAILY_DATA_DIR, { recursive: true, force: true });
});

describe("attendanceDailyDataSaver", () => {
  const context = {
    batch: "BTECH_CSE_2027",
    date: "2026-07-09",
    slot: "09:00-10:00",
    room: "R101",
    subject: "DBMS",
    faculty: "Dr. X",
    semester: "5",
    locksemId: "ls1",
  };
  const mlResult = { attendance: { R1: { status: "present" } }, summary: { present: 1 } };

  it("uses the overridable ATTENDANCE_DAILY_DATA_DIR env dir", () => {
    expect(DAILY_DATA_DIR).toBe(process.env.ATTENDANCE_DAILY_DATA_DIR);
    expect(fs.existsSync(DAILY_DATA_DIR)).toBe(true);
  });

  it("round-trips a saved check through list + read", () => {
    saveAttendanceDailyData(context, mlResult, 1);

    const files = listDailyDataFiles();
    const match = files.find((f) => f.batch === context.batch && f.date === context.date);
    expect(match).toBeDefined();

    const data = readDailyDataFile(match.filename);
    expect(data.checks.length).toBeGreaterThanOrEqual(1);
    expect(data.checks[0].summary.present).toBe(1);
  });

  it("appends multiple checks for the same batch+date+slot instead of overwriting", () => {
    const ctx2 = { ...context, date: "2026-07-10" };
    saveAttendanceDailyData(ctx2, mlResult, 1);
    saveAttendanceDailyData(ctx2, mlResult, 2);

    const files = listDailyDataFiles().filter((f) => f.date === ctx2.date && f.batch === ctx2.batch);
    expect(files.length).toBe(1);
    const data = readDailyDataFile(files[0].filename);
    expect(data.checks.length).toBe(2);
  });

  it("returns null for a file that doesn't exist", () => {
    expect(readDailyDataFile("does-not-exist.json")).toBeNull();
  });
});

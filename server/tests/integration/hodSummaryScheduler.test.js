jest.mock("../../src/modules/attendanceModule/controllers/alertNotifier");

const alertNotifier = require("../../src/modules/attendanceModule/controllers/alertNotifier");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const NotificationSettings = require("../../src/models/attendanceModule/notificationSettings");
const AttendanceReport = require("../../src/models/attendanceReport");
const { runDailySummaryCheck } = require("../../src/modules/attendanceModule/controllers/hodSummaryScheduler");

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
  jest.useRealTimers();
});
afterAll(disconnect);

describe("runDailySummaryCheck", () => {
  it("sends nothing when the daily-summary config is disabled", async () => {
    await NotificationSettings.create({
      enabled: true,
      dailySummaryConfig: { enabled: false, frequency: "daily", mode: "all", threshold: 75 },
    });
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027", department: "CSE", date: new Date().toISOString().slice(0, 10),
      timeSlot: "09:00-10:00", summary: { totalStudents: 10, present: 5, absent: 5, review: 0, attendancePct: 50 },
    });

    await runDailySummaryCheck();
    expect(alertNotifier.notifyDailySummary).not.toHaveBeenCalled();
  });

  it("sends nothing when notifications are globally disabled, even if dailySummary is enabled", async () => {
    await NotificationSettings.create({
      enabled: false,
      dailySummaryConfig: { enabled: true, frequency: "daily", mode: "all", threshold: 75 },
    });

    await runDailySummaryCheck();
    expect(alertNotifier.notifyDailySummary).not.toHaveBeenCalled();
  });

  it("in threshold mode, only includes rows below the threshold", async () => {
    jest.useFakeTimers({ toFake: ["Date"] }).setSystemTime(new Date("2026-07-09T12:00:00")); // a Thursday
    await NotificationSettings.create({
      enabled: true,
      dailySummaryConfig: { enabled: true, frequency: "daily", mode: "threshold", threshold: 75 },
    });
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027", department: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
      subject: "DBMS", summary: { totalStudents: 10, present: 5, absent: 5, review: 0, attendancePct: 50 },
    });
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027", department: "CSE", date: "2026-07-09", timeSlot: "10:00-11:00",
      subject: "OS", summary: { totalStudents: 10, present: 9, absent: 1, review: 0, attendancePct: 90 },
    });

    await runDailySummaryCheck();

    expect(alertNotifier.notifyDailySummary).toHaveBeenCalledTimes(1);
    const call = alertNotifier.notifyDailySummary.mock.calls[0][0];
    expect(call.dept).toBe("CSE");
    expect(call.rows).toHaveLength(1);
    expect(call.rows[0].subject).toBe("DBMS");
  });

  it("skips a weekly run entirely on a non-Friday", async () => {
    jest.useFakeTimers({ toFake: ["Date"] }).setSystemTime(new Date("2026-07-09T12:00:00")); // Thursday
    await NotificationSettings.create({
      enabled: true,
      dailySummaryConfig: { enabled: true, frequency: "weekly", mode: "all", threshold: 75 },
    });
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027", department: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
      summary: { totalStudents: 10, present: 5, absent: 5, review: 0, attendancePct: 50 },
    });

    await runDailySummaryCheck();
    expect(alertNotifier.notifyDailySummary).not.toHaveBeenCalled();
  });
});

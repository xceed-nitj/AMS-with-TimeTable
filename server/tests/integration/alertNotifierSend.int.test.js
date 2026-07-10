jest.mock("../../src/modules/mailsender");

const { connect, clearDatabase, disconnect } = require("../helpers/db");
const NotificationSettings = require("../../src/models/attendanceModule/notificationSettings");
const mailSender = require("../../src/modules/mailsender");
const alertNotifier = require("../../src/modules/attendanceModule/controllers/alertNotifier");

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  // alertNotifier keeps a module-level cooldown map (lastSent) that would
  // otherwise leak between tests that share a cooldownKey.
  alertNotifier._resetCooldowns();
});
afterAll(disconnect);

async function seedSettings(overrides = {}) {
  return NotificationSettings.create({
    enabled: true,
    roles: [
      { role: "admin", alertTypes: { classBunk: true, noReportSaved: true } },
      { role: "coordinator", alertTypes: { classBunk: true, noReportSaved: true } },
      { role: "head", alertTypes: {} },
    ],
    recipients: [
      { email: "admin@x.com", role: "admin" },
      { email: "cse-coord@x.com", role: "coordinator", dept: "CSE" },
      { email: "ece-coord@x.com", role: "coordinator", dept: "ECE" },
    ],
    ...overrides,
  });
}

describe("sendAlert (via notifyClassBunk)", () => {
  it("sends nothing when settings.enabled is false", async () => {
    await seedSettings({ enabled: false });

    await alertNotifier.notifyClassBunk({
      batch: "BTECH_CSE_2027", subject: "DBMS", faculty: "Dr. X", room: "R101",
      date: "2026-07-09", timeSlot: "09:00-10:00", dept: "CSE", totalStudents: 10,
    });

    expect(mailSender).not.toHaveBeenCalled();
  });

  it("sends nothing when no role has opted into classBunk", async () => {
    await seedSettings({
      roles: [
        { role: "admin", alertTypes: { classBunk: false } },
        { role: "coordinator", alertTypes: { classBunk: false } },
        { role: "head", alertTypes: { classBunk: false } },
      ],
    });

    await alertNotifier.notifyClassBunk({
      batch: "BTECH_CSE_2027", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00", totalStudents: 5,
    });

    expect(mailSender).not.toHaveBeenCalled();
  });

  it("mails the admin and the matching-dept coordinator, but not a different dept's coordinator", async () => {
    await seedSettings();

    await alertNotifier.notifyClassBunk({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE",
      date: "2026-07-09", timeSlot: "09:00-10:00", totalStudents: 10,
    });

    const mailedTo = mailSender.mock.calls.map((call) => call[0]);
    expect(mailedTo).toContain("admin@x.com");
    expect(mailedTo).toContain("cse-coord@x.com");
    expect(mailedTo).not.toContain("ece-coord@x.com");
  });

  it("suppresses a second identical alert within the cooldown window, then allows it again after", async () => {
    await seedSettings();

    // Spying on just Date.now (rather than jest.useFakeTimers, which replaces
    // the whole Date global) lets us control the cooldown clock without also
    // freezing the timers the MongoDB driver relies on internally — full fake
    // timers here hang every subsequent DB call indefinitely.
    const dateNowSpy = jest.spyOn(Date, "now");
    dateNowSpy.mockReturnValue(new Date("2026-07-09T00:00:00Z").getTime());
    await alertNotifier.notifyNoReportSaved({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
    });
    expect(mailSender).toHaveBeenCalledTimes(2); // admin + cse coordinator

    dateNowSpy.mockReturnValue(new Date("2026-07-09T00:05:00Z").getTime()); // 5 min later, still in cooldown
    await alertNotifier.notifyNoReportSaved({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
    });
    expect(mailSender).toHaveBeenCalledTimes(2); // unchanged — suppressed

    dateNowSpy.mockReturnValue(new Date("2026-07-09T00:11:00Z").getTime()); // past the 10-min cooldown
    await alertNotifier.notifyNoReportSaved({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
    });
    expect(mailSender).toHaveBeenCalledTimes(4); // fired again

    dateNowSpy.mockRestore();
  });

  it("keeps mailing remaining recipients even if one send rejects", async () => {
    await seedSettings();
    mailSender
      .mockRejectedValueOnce(new Error("SMTP down"))
      .mockResolvedValue(undefined);

    await alertNotifier.notifyClassBunk({
      batch: "BTECH_CSE_2027", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00", totalStudents: 3,
    });

    expect(mailSender).toHaveBeenCalledTimes(2); // admin (rejected) + cse coordinator (sent)
  });
});

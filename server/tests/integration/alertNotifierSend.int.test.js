jest.mock("../../src/modules/mailsender");

const { connect, clearDatabase, disconnect } = require("../helpers/db");
const NotificationSettings = require("../../src/models/attendanceModule/notificationSettings");
const mailSender = require("../../src/modules/mailsender");

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(disconnect);

// alertNotifier keeps a module-level cooldown map (lastSent). Rather than
// jest.resetModules() (which would also drop the live mongoose connection
// this file depends on), evict just alertNotifier's own cache entry so it
// re-executes with a fresh lastSent map while reusing the already-connected
// mongoose models and the mailSender mock.
function freshAlertNotifier() {
  const modulePath = require.resolve("../../src/modules/attendanceModule/controllers/alertNotifier");
  delete require.cache[modulePath];
  return require(modulePath);
}

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
    const alertNotifier = freshAlertNotifier();

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
    const alertNotifier = freshAlertNotifier();

    await alertNotifier.notifyClassBunk({
      batch: "BTECH_CSE_2027", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00", totalStudents: 5,
    });

    expect(mailSender).not.toHaveBeenCalled();
  });

  it("mails the admin and the matching-dept coordinator, but not a different dept's coordinator", async () => {
    await seedSettings();
    const alertNotifier = freshAlertNotifier();

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
    const alertNotifier = freshAlertNotifier();

    jest.useFakeTimers().setSystemTime(new Date("2026-07-09T00:00:00Z"));
    await alertNotifier.notifyNoReportSaved({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
    });
    expect(mailSender).toHaveBeenCalledTimes(2); // admin + cse coordinator

    jest.setSystemTime(new Date("2026-07-09T00:05:00Z")); // 5 min later, still in cooldown
    await alertNotifier.notifyNoReportSaved({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
    });
    expect(mailSender).toHaveBeenCalledTimes(2); // unchanged — suppressed

    jest.setSystemTime(new Date("2026-07-09T00:11:00Z")); // past the 10-min cooldown
    await alertNotifier.notifyNoReportSaved({
      batch: "BTECH_CSE_2027", subject: "DBMS", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00",
    });
    expect(mailSender).toHaveBeenCalledTimes(4); // fired again

    jest.useRealTimers();
  });

  it("keeps mailing remaining recipients even if one send rejects", async () => {
    await seedSettings();
    const alertNotifier = freshAlertNotifier();
    mailSender
      .mockRejectedValueOnce(new Error("SMTP down"))
      .mockResolvedValue(undefined);

    await alertNotifier.notifyClassBunk({
      batch: "BTECH_CSE_2027", dept: "CSE", date: "2026-07-09", timeSlot: "09:00-10:00", totalStudents: 3,
    });

    expect(mailSender).toHaveBeenCalledTimes(2); // admin (rejected) + cse coordinator (sent)
  });
});

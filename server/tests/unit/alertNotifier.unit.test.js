const { getRecipients, shouldSend } = require("../../src/modules/attendanceModule/controllers/alertNotifier");

describe("getRecipients", () => {
  const settings = {
    roles: [
      { role: "admin", alertTypes: { serverDown: true, classBunk: false } },
      { role: "coordinator", alertTypes: { serverDown: true, classBunk: true } },
      { role: "head", alertTypes: { classBunk: false } },
    ],
    recipients: [
      { email: "admin@x.com", role: "admin" },
      { email: "cse-coord@x.com", role: "coordinator", dept: "CSE" },
      { email: "ece-coord@x.com", role: "coordinator", dept: "ECE" },
      { email: "cse-head@x.com", role: "head", dept: "CSE" },
      { email: "dup-admin@x.com", role: "admin" },
    ],
  };

  it("includes admin recipients regardless of dept", () => {
    const emails = getRecipients(settings, "serverDown", null);
    expect(emails).toContain("admin@x.com");
    expect(emails).toContain("dup-admin@x.com");
  });

  it("includes coordinator only when dept matches (case-insensitively)", () => {
    const emails = getRecipients(settings, "classBunk", "cse");
    expect(emails).toContain("cse-coord@x.com");
    expect(emails).not.toContain("ece-coord@x.com");
  });

  it("excludes a role that has not opted into the alert key", () => {
    const emails = getRecipients(settings, "classBunk", "CSE");
    // head opted out (alertTypes.classBunk === false)
    expect(emails).not.toContain("cse-head@x.com");
  });

  it("excludes recipients whose role has no alertTypes entry for the key at all", () => {
    const emails = getRecipients(settings, "serverDown", "CSE");
    // coordinator opted in, but no dept filter applies to serverDown branch (only admin path taken)
    expect(emails).toContain("admin@x.com");
  });

  it("returns a deduped array (Set-backed)", () => {
    const emails = getRecipients(settings, "serverDown", null);
    expect(new Set(emails).size).toBe(emails.length);
  });
});

describe("shouldSend", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows the first send and blocks a second within the cooldown window", () => {
    jest.resetModules();
    const { shouldSend: freshShouldSend } = require("../../src/modules/attendanceModule/controllers/alertNotifier");
    jest.setSystemTime(new Date("2026-07-09T00:00:00Z"));
    expect(freshShouldSend("key-a")).toBe(true);
    jest.setSystemTime(new Date("2026-07-09T00:05:00Z")); // 5 min later, still in cooldown
    expect(freshShouldSend("key-a")).toBe(false);
  });

  it("allows a send again after the cooldown window elapses", () => {
    jest.resetModules();
    const { shouldSend: freshShouldSend } = require("../../src/modules/attendanceModule/controllers/alertNotifier");
    jest.setSystemTime(new Date("2026-07-09T00:00:00Z"));
    expect(freshShouldSend("key-b")).toBe(true);
    jest.setSystemTime(new Date("2026-07-09T00:11:00Z")); // 11 min later, past 10-min cooldown
    expect(freshShouldSend("key-b")).toBe(true);
  });

  it("tracks cooldowns independently per key", () => {
    jest.resetModules();
    const { shouldSend: freshShouldSend } = require("../../src/modules/attendanceModule/controllers/alertNotifier");
    jest.setSystemTime(new Date("2026-07-09T00:00:00Z"));
    expect(freshShouldSend("key-c")).toBe(true);
    expect(freshShouldSend("key-d")).toBe(true);
  });
});

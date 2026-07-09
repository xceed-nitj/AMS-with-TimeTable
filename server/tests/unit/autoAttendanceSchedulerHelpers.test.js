const {
  timeStrToMin,
  safeSubject,
  currentSession,
} = require("../../src/modules/attendanceModule/controllers/autoAttendanceScheduler");

describe("timeStrToMin", () => {
  it("parses HH:MM into minutes since midnight", () => {
    expect(timeStrToMin("09:05")).toBe(9 * 60 + 5);
    expect(timeStrToMin("00:00")).toBe(0);
    expect(timeStrToMin("23:59")).toBe(23 * 60 + 59);
  });

  it("returns null for missing or malformed input", () => {
    expect(timeStrToMin(null)).toBeNull();
    expect(timeStrToMin("")).toBeNull();
    expect(timeStrToMin("0905")).toBeNull();
    expect(timeStrToMin(905)).toBeNull();
  });
});

describe("safeSubject", () => {
  it("replaces non-alphanumeric runs with a single underscore", () => {
    expect(safeSubject("DBMS Lab (Sec-A)")).toBe("DBMS_Lab_Sec_A");
  });

  it("trims leading/trailing underscores produced by sanitization", () => {
    expect(safeSubject("  DBMS!!  ")).toBe("DBMS");
  });

  it("returns an empty string for falsy input", () => {
    expect(safeSubject(null)).toBe("");
    expect(safeSubject(undefined)).toBe("");
  });
});

describe("currentSession", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns <year>-<nextYearShort> when month >= August", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-01"));
    expect(currentSession()).toBe("2026-27");
  });

  it("returns <prevYear>-<yearShort> when month < August", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-01"));
    expect(currentSession()).toBe("2025-26");
  });
});

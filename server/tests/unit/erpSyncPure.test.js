const { rollSetsEqual } = require("../../src/modules/attendanceModule/controllers/erpSyncController");

describe("rollSetsEqual", () => {
  it("treats identical sets as equal regardless of order", () => {
    expect(rollSetsEqual(["21CS001", "21CS002"], ["21CS002", "21CS001"])).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(rollSetsEqual([" 21cs001 "], ["21CS001"])).toBe(true);
  });

  it("returns false on length mismatch", () => {
    expect(rollSetsEqual(["21CS001"], ["21CS001", "21CS002"])).toBe(false);
  });

  it("returns false when contents differ", () => {
    expect(rollSetsEqual(["21CS001"], ["21CS002"])).toBe(false);
  });

  it("treats two empty lists as equal", () => {
    expect(rollSetsEqual([], [])).toBe(true);
  });
});

describe("erpConfigured / ERP_API_URL (module-load env capture)", () => {
  it("is false when ERP_API_URL is unset", () => {
    jest.isolateModules(() => {
      delete process.env.ERP_API_URL;
      const { erpConfigured } = require("../../src/modules/attendanceModule/controllers/erpSyncController");
      expect(erpConfigured()).toBe(false);
    });
  });

  it("is true when ERP_API_URL is set before the module is required", () => {
    jest.isolateModules(() => {
      process.env.ERP_API_URL = "http://erp.test";
      const { erpConfigured } = require("../../src/modules/attendanceModule/controllers/erpSyncController");
      expect(erpConfigured()).toBe(true);
      delete process.env.ERP_API_URL;
    });
  });
});

describe("firstYearStudentSem", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 1 for months August–December", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-15"));
    const { firstYearStudentSem } = require("../../src/modules/attendanceModule/controllers/erpSyncController");
    expect(firstYearStudentSem()).toBe(1);
  });

  it("returns 2 for months January–July", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-15"));
    const { firstYearStudentSem } = require("../../src/modules/attendanceModule/controllers/erpSyncController");
    expect(firstYearStudentSem()).toBe(2);
  });
});

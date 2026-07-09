jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

jest.mock("../../src/modules/attendanceModule/controllers/erpSyncController", () => ({
  ...jest.requireActual("../../src/modules/attendanceModule/controllers/erpSyncController"),
  erpConfigured: jest.fn(),
  syncSubjectRolls: jest.fn(),
}));
jest.mock("../../src/modules/attendanceModule/controllers/embeddingController", () => ({
  runGenerateHeadless: jest.fn(),
}));

const { connect, clearDatabase, disconnect } = require("../helpers/db");
const Subject = require("../../src/models/subject");
const ErpSyncSettings = require("../../src/models/attendanceModule/erpSyncSettings");
const { erpConfigured, syncSubjectRolls } = require("../../src/modules/attendanceModule/controllers/erpSyncController");
const { runGenerateHeadless } = require("../../src/modules/attendanceModule/controllers/embeddingController");
const { runErpAutoSync } = require("../../src/modules/attendanceModule/controllers/erpAutoSyncScheduler");

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(disconnect);

function subjectDoc(overrides = {}) {
  return Subject.create({
    subjectFullName: "Database Management Systems",
    type: "theory",
    subCode: "CS301",
    subName: "DBMS",
    studentCount: 40,
    sem: "5",
    degree: "BTECH",
    dept: "CSE",
    ...overrides,
  });
}

describe("runErpAutoSync", () => {
  it("skips entirely when ERP is not configured", async () => {
    erpConfigured.mockReturnValue(false);
    await subjectDoc();

    await runErpAutoSync();
    expect(syncSubjectRolls).not.toHaveBeenCalled();
  });

  it("skips entirely when the ErpSyncSettings toggle is disabled", async () => {
    erpConfigured.mockReturnValue(true);
    await ErpSyncSettings.create({ enabled: false });
    await subjectDoc();

    await runErpAutoSync();
    expect(syncSubjectRolls).not.toHaveBeenCalled();
  });

  it("regenerates embeddings only for subjects whose roster changed", async () => {
    erpConfigured.mockReturnValue(true);
    await ErpSyncSettings.create({ enabled: true });
    const unchanged = await subjectDoc({ subCode: "CS301", subName: "DBMS" });
    const changed = await subjectDoc({ subCode: "CS302", subName: "OS", subjectFullName: "Operating Systems" });

    syncSubjectRolls.mockImplementation(async (subject) => {
      if (subject._id.toString() === unchanged._id.toString()) {
        return { ok: true, rollsChanged: false, rollNos: [] };
      }
      return { ok: true, rollsChanged: true, rollNos: ["21CS001"] };
    });
    runGenerateHeadless.mockResolvedValue({ ok: true, summary: { success: 1, failed: 0 } });

    await runErpAutoSync();

    expect(syncSubjectRolls).toHaveBeenCalledTimes(2);
    expect(runGenerateHeadless).toHaveBeenCalledTimes(1);
    expect(runGenerateHeadless.mock.calls[0][0].subjectId.toString()).toBe(changed._id.toString());
  });

  it("counts a failed ERP fetch without throwing and continues to the next subject", async () => {
    erpConfigured.mockReturnValue(true);
    await ErpSyncSettings.create({ enabled: true });
    await subjectDoc({ subCode: "CS301" });
    await subjectDoc({ subCode: "CS302", subjectFullName: "Operating Systems", subName: "OS" });

    syncSubjectRolls
      .mockResolvedValueOnce({ ok: false, error: "HTTP 500" })
      .mockResolvedValueOnce({ ok: true, rollsChanged: false, rollNos: [] });

    await expect(runErpAutoSync()).resolves.toBeUndefined();
    expect(syncSubjectRolls).toHaveBeenCalledTimes(2);
    expect(runGenerateHeadless).not.toHaveBeenCalled();
  });
});

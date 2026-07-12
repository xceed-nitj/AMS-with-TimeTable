// Env must be set before erpAttendancePushController is required — it reads
// ERP_ATTENDANCE_PUSH_URL/ERP_PUSH_SECRET into module-load-time consts,
// same convention erpSyncController.js uses (see erpSyncPure.test.js).
process.env.ERP_ATTENDANCE_PUSH_URL = "http://erp.test/api/xceed/attendance";
process.env.ERP_PUSH_SECRET = "test-push-secret";

jest.mock("axios");
const axios = require("axios");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const AttendanceReport = require("../../src/models/attendanceReport");
const {
  pushAttendanceToErp,
  retryFailedPushes,
  syncAllPending,
  runNightlyErpAttendanceRetry,
  erpPushConfigured,
  DEFAULT_MAX_ATTEMPTS,
} = require("../../src/modules/attendanceModule/controllers/erpAttendancePushController");
const ErpPushSettings = require("../../src/models/attendanceModule/erpPushSettings");

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(disconnect);

function baseReport(overrides = {}) {
  return {
    batch: "BTECH_CSE_2027",
    department: "CSE",
    semester: "5",
    subject: "Digital Signal Processing",
    subjectMeta: { subName: "DSP", subCode: "ECPC_306", subjectFullName: "Digital Signal Processing" },
    room: "CSE-301",
    date: "2026-07-09",
    timeSlot: "09:00-10:00",
    status: "draft",
    finalReport: [
      { rollNo: "21CS001", finalStatus: "P", avgConfidence: 0.92314 },
      { rollNo: "21CS002", finalStatus: "R", avgConfidence: 0.4 },
    ],
    summary: { totalStudents: 2, present: 1, absent: 0, review: 1, attendancePct: 50 },
    ...overrides,
  };
}

function mockErpResponse(status, responseCode, extra = {}) {
  return { status, data: { status: status < 300 ? "SUCCESS" : "FAILURE", responseCode, ...extra } };
}

describe("erpPushConfigured", () => {
  it("is true when both env vars are set (as configured for this file)", () => {
    expect(erpPushConfigured()).toBe(true);
  });
});

describe("periodId / xceedTimestamp — minted once, stable across saves", () => {
  it("builds a structured periodId from batch+room+date+timeSlot", async () => {
    const report = await AttendanceReport.create(baseReport());
    expect(report.periodId).toBe("BTECH-CSE-2027-CSE-301-2026-07-09-09-00-10-00");
  });

  it("does not regenerate periodId or xceedTimestamp on a later save", async () => {
    const report = await AttendanceReport.create(baseReport());
    const originalPeriodId = report.periodId;
    const originalTimestamp = report.xceedTimestamp;

    report.summary.present = 5;
    await report.save();

    expect(report.periodId).toBe(originalPeriodId);
    expect(report.xceedTimestamp.getTime()).toBe(originalTimestamp.getTime());
  });
});

describe("pushAttendanceToErp — payload shape", () => {
  it("maps R to ABSENT and rounds confidence, sorted by rollNo", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    await pushAttendanceToErp(report);

    const [, payload] = axios.post.mock.calls[0];
    expect(payload.recognitionResults).toEqual([
      { rollNo: "21CS001", status: "PRESENT", confidence: 0.92 },
      { rollNo: "21CS002", status: "ABSENT", confidence: 0.4 },
    ]);
    expect(payload.periodId).toBe(report.periodId);
    expect(payload.sessionDate).toBe("2026-07-09");
    expect(payload.classId).toBe("5DSP");
    expect(payload.xceedTimestamp).toBe(report.xceedTimestamp.toISOString());
  });

  it("signs the request with X-Signature/X-Timestamp/X-Idempotency-Key headers", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    await pushAttendanceToErp(report);

    const [, , options] = axios.post.mock.calls[0];
    expect(options.headers["X-Signature"]).toBeTruthy();
    expect(options.headers["X-Timestamp"]).toBeTruthy();
    expect(options.headers["X-Idempotency-Key"]).toBeTruthy();
  });
});

describe("pushAttendanceToErp — response code branching", () => {
  it("ATTENDANCE_ACCEPTED: marks sent and locks the period as posted_acked", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    const result = await pushAttendanceToErp(report);

    expect(result.ok).toBe(true);
    expect(report.erpPush.status).toBe("sent");
    expect(report.erpPush.responseCode).toBe("ATTENDANCE_ACCEPTED");
    expect(report.erpLockState).toBe("posted_acked");
  });

  it("ATTENDANCE_ACCEPTED_WITH_FLAGS: marks sent, locks, and stores flags[] as-is", async () => {
    const report = await AttendanceReport.create(baseReport());
    const flags = [{ rollNo: "22CS099", flagType: "DISCARDED_ROLL_NUMBER", reason: "not in roster" }];
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED_WITH_FLAGS", { flags }));

    const result = await pushAttendanceToErp(report);

    expect(result.ok).toBe(true);
    expect(report.erpPush.status).toBe("sent");
    expect(report.erpLockState).toBe("posted_acked");
    expect(report.erpPush.flags).toEqual(flags);
  });

  it("PERIOD_ALREADY_FINALIZED: locks as faculty_finalized and blocks any further push", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(409, "PERIOD_ALREADY_FINALIZED", { message: "Faculty already finalised" }));

    const result = await pushAttendanceToErp(report);
    expect(result.ok).toBe(false);
    expect(result.permanent).toBe(true);
    expect(report.erpLockState).toBe("faculty_finalized");

    axios.post.mockClear();
    const second = await pushAttendanceToErp(report);
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe("faculty_finalized");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("PERIOD_ALREADY_POSTED: treated as success, no-op", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(409, "PERIOD_ALREADY_POSTED"));

    const result = await pushAttendanceToErp(report);
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(report.erpLockState).toBe("posted_acked");
  });

  it("FUTURE_PERIOD_REJECTED: permanent failure, pins attempts so it's never auto-retried", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(422, "FUTURE_PERIOD_REJECTED"));

    const result = await pushAttendanceToErp(report);
    expect(result.ok).toBe(false);
    expect(result.permanent).toBe(true);
    expect(report.erpPush.attempts).toBe(DEFAULT_MAX_ATTEMPTS);
    expect(report.erpLockState).toBe("none"); // not a locking scenario
  });

  it("INVALID_PAYLOAD: permanent failure, same as future-period", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue(mockErpResponse(400, "INVALID_PAYLOAD"));

    const result = await pushAttendanceToErp(report);
    expect(result.ok).toBe(false);
    expect(result.permanent).toBe(true);
    expect(report.erpPush.attempts).toBe(DEFAULT_MAX_ATTEMPTS);
  });

  it("unrecognised response: transient failure, eligible for retry", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue({ status: 500, data: {} });

    const result = await pushAttendanceToErp(report);
    expect(result.ok).toBe(false);
    expect(result.permanent).toBeUndefined();
    expect(report.erpPush.status).toBe("failed");
    expect(report.erpPush.attempts).toBe(1);
  });
});

describe("pushAttendanceToErp — guards", () => {
  it("skips posting a future-dated period without calling ERP", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const report = await AttendanceReport.create(baseReport({ date: futureDate }));

    const result = await pushAttendanceToErp(report);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("future_period");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("stops auto-retrying once attempts reach DEFAULT_MAX_ATTEMPTS, unless bypassCap is set", async () => {
    const report = await AttendanceReport.create(baseReport());
    axios.post.mockResolvedValue({ status: 500, data: {} });

    await pushAttendanceToErp(report); // attempt 1
    await pushAttendanceToErp(report); // attempt 2 (== DEFAULT_MAX_ATTEMPTS)
    expect(report.erpPush.attempts).toBe(2);

    const capped = await pushAttendanceToErp(report);
    expect(capped.skipped).toBe(true);
    expect(capped.reason).toBe("attempts_exhausted");

    const bypassed = await pushAttendanceToErp(report, { bypassCap: true });
    expect(bypassed.skipped).toBeUndefined();
    expect(axios.post).toHaveBeenCalledTimes(3);
  });
});

describe("retryFailedPushes — auto sweep", () => {
  it("only retries unlocked reports under the attempt cap", async () => {
    const due = await AttendanceReport.create(baseReport());
    const locked = await AttendanceReport.create(
      baseReport({ timeSlot: "10:00-11:00", erpLockState: "faculty_finalized", erpPush: { status: "failed" } }),
    );
    const exhausted = await AttendanceReport.create(
      baseReport({ timeSlot: "11:00-12:00", erpPush: { status: "failed", attempts: DEFAULT_MAX_ATTEMPTS } }),
    );
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    await retryFailedPushes();

    expect(axios.post).toHaveBeenCalledTimes(1);
    const updatedDue = await AttendanceReport.findById(due._id);
    expect(updatedDue.erpPush.status).toBe("sent");
    const updatedLocked = await AttendanceReport.findById(locked._id);
    expect(updatedLocked.erpPush.status).toBe("failed");
    const updatedExhausted = await AttendanceReport.findById(exhausted._id);
    expect(updatedExhausted.erpPush.status).toBe("failed");
  });
});

describe("syncAllPending — Sync all button", () => {
  it("pushes every unlocked pending/failed report, bypassing the attempt cap", async () => {
    await AttendanceReport.create(
      baseReport({ erpPush: { status: "failed", attempts: DEFAULT_MAX_ATTEMPTS } }),
    );
    await AttendanceReport.create(
      baseReport({ timeSlot: "10:00-11:00", erpLockState: "faculty_finalized", erpPush: { status: "failed" } }),
    );
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    const result = await syncAllPending();

    expect(result.total).toBe(1); // the locked one is excluded from candidates
    expect(result.sent).toBe(1);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe("retryFailedPushes — settings-driven interval and cap", () => {
  it("respects a per-report backoff window derived from retryIntervalMinutes", async () => {
    const settings = await ErpPushSettings.getSettings();
    settings.retryIntervalMinutes = 10;
    await settings.save();

    const justAttempted = await AttendanceReport.create(
      baseReport({ erpPush: { status: "failed", attempts: 1, lastAttemptAt: new Date() } }),
    );
    const longAgo = await AttendanceReport.create(
      baseReport({ timeSlot: "10:00-11:00", erpPush: { status: "failed", attempts: 1, lastAttemptAt: new Date(Date.now() - 15 * 60 * 1000) } }),
    );
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    await retryFailedPushes();

    expect(axios.post).toHaveBeenCalledTimes(1);
    const updatedRecent = await AttendanceReport.findById(justAttempted._id);
    expect(updatedRecent.erpPush.status).toBe("failed"); // too soon, not retried
    const updatedOld = await AttendanceReport.findById(longAgo._id);
    expect(updatedOld.erpPush.status).toBe("sent");
  });

  it("uses an admin-raised maxAttempts to allow more auto-retries", async () => {
    const settings = await ErpPushSettings.getSettings();
    settings.maxAttempts = 5;
    await settings.save();

    const report = await AttendanceReport.create(
      baseReport({ erpPush: { status: "failed", attempts: 3 } }), // > DEFAULT_MAX_ATTEMPTS
    );
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    await retryFailedPushes();

    const updated = await AttendanceReport.findById(report._id);
    expect(updated.erpPush.status).toBe("sent");
  });
});

describe("runNightlyErpAttendanceRetry", () => {
  it("skips when nightlyRetryEnabled is false", async () => {
    const settings = await ErpPushSettings.getSettings();
    settings.nightlyRetryEnabled = false;
    await settings.save();

    await AttendanceReport.create(baseReport({ erpPush: { status: "failed", attempts: DEFAULT_MAX_ATTEMPTS } }));

    const result = await runNightlyErpAttendanceRetry();
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("nightly_disabled");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("bypasses the attempt cap when enabled", async () => {
    const settings = await ErpPushSettings.getSettings();
    settings.nightlyRetryEnabled = true;
    await settings.save();

    await AttendanceReport.create(baseReport({ erpPush: { status: "failed", attempts: DEFAULT_MAX_ATTEMPTS } }));
    axios.post.mockResolvedValue(mockErpResponse(200, "ATTENDANCE_ACCEPTED"));

    const result = await runNightlyErpAttendanceRetry();
    expect(result.sent).toBe(1);
  });
});

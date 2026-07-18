// Inbound faculty-override-sync callback (spec §13) — ERP calls this
// directly, not a logged-in browser session, so auth is HMAC signature +
// optional IP allowlist + rate limiting (erpInboundSecurity.js) rather than
// the cookie-based role check. ERP_INBOUND_SECRET is read at request time
// (not captured at require-time), so it's safe to set per-test via
// process.env without jest.isolateModules.
const crypto = require("crypto");
const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const AttendanceReport = require("../../src/models/attendanceReport");

const BASE = "/api/v1/attendancemodule/erp";
const SECRET = "test-inbound-secret";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
  process.env.ERP_INBOUND_SECRET = SECRET;
});
afterEach(async () => {
  await clearDatabase();
  delete process.env.ERP_INBOUND_IP_ALLOWLIST;
});
afterAll(async () => {
  delete process.env.ERP_INBOUND_SECRET;
  await disconnect();
});

function sign(body, timestamp, secret = SECRET) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

async function post(payload, { secret = SECRET, timestamp = String(Date.now()), skipSignature = false } = {}) {
  const rawBody = JSON.stringify(payload);
  const req = request(app).post(`${BASE}/faculty-override-sync`).set("Content-Type", "application/json");
  if (!skipSignature) {
    req.set("X-Timestamp", timestamp).set("X-Signature", sign(rawBody, timestamp, secret));
  }
  return req.send(rawBody);
}

// Distinct timeSlot per call (unless overridden) so each test gets its own
// periodId — rateLimitByPeriod caps requests per periodId at 5/min, and
// several tests in this file post more than once, so sharing one periodId
// across every `it()` would trip that limiter as an unrelated side effect.
let timeSlotCounter = 0;
function baseReport(overrides = {}) {
  timeSlotCounter += 1;
  return {
    batch: "BTECH_CSE_2027",
    department: "CSE",
    date: "2026-07-09",
    room: "CSE-301",
    timeSlot: `0${timeSlotCounter}:00-1${timeSlotCounter}:00`,
    status: "draft",
    finalReport: [
      { rollNo: "21CS001", finalStatus: "P" },
      { rollNo: "21CS002", finalStatus: "A" },
    ],
    summary: { totalStudents: 2, present: 1, absent: 1, review: 0, attendancePct: 50 },
    ...overrides,
  };
}

describe("POST /erp/faculty-override-sync — signature verification", () => {
  it("rejects a request with no signature headers (400 INVALID_PAYLOAD)", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await post(
      { periodId: report.periodId, facultyLockedAt: new Date().toISOString(), finalAttendance: [] },
      { skipSignature: true },
    );
    expect(res.status).toBe(400);
    expect(res.body.responseCode).toBe("INVALID_PAYLOAD");
  });

  it("rejects a request signed with the wrong secret", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await post(
      { periodId: report.periodId, facultyLockedAt: new Date().toISOString(), finalAttendance: [] },
      { secret: "wrong-secret" },
    );
    expect(res.status).toBe(400);
    expect(res.body.responseCode).toBe("INVALID_PAYLOAD");
  });

  it("accepts a signature made with ERP_INBOUND_SECRET_PREVIOUS during rotation", async () => {
    process.env.ERP_INBOUND_SECRET_PREVIOUS = "old-secret";
    const report = await AttendanceReport.create(baseReport());
    const res = await post(
      {
        periodId: report.periodId,
        facultyLockedAt: "2026-07-09T18:42:10+05:30",
        finalAttendance: [{ rollNo: "21CS001", finalStatus: "PRESENT", remarks: null }],
      },
      { secret: "old-secret" },
    );
    expect(res.status).toBe(200);
    delete process.env.ERP_INBOUND_SECRET_PREVIOUS;
  });
});

describe("POST /erp/faculty-override-sync — business logic", () => {
  it("records overrides in separate fields, saves remarks as-is, without touching finalStatus", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await post({
      periodId: report.periodId,
      facultyLockedAt: "2026-07-09T18:42:10+05:30",
      finalAttendance: [
        { rollNo: "21CS001", finalStatus: "PRESENT", remarks: null }, // unchanged
        { rollNo: "21CS002", finalStatus: "PRESENT", remarks: "Camera did not capture" }, // overridden A->P
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.responseCode).toBe("SYNC_ACCEPTED");

    const updated = await AttendanceReport.findById(report._id);
    const s1 = updated.finalReport.find((s) => s.rollNo === "21CS001");
    const s2 = updated.finalReport.find((s) => s.rollNo === "21CS002");

    // Unchanged entry — no override recorded
    expect(s1.isOverridden).toBe(false);
    expect(s1.finalStatus).toBe("P");

    // Overridden entry — recorded separately, our finalStatus untouched
    expect(s2.finalStatus).toBe("A");
    expect(s2.erpOverriddenStatus).toBe("P");
    expect(s2.isOverridden).toBe(true);
    expect(s2.facultyRemark).toBe("Camera did not capture"); // stored exactly as sent

    expect(updated.facultyLockedAt.toISOString()).toBe(new Date("2026-07-09T18:42:10+05:30").toISOString());
    expect(updated.erpLockState).toBe("faculty_finalized");
  });

  it("returns 404 PERIOD_NOT_FOUND for an unknown periodId", async () => {
    const res = await post({
      periodId: "no-such-period",
      facultyLockedAt: new Date().toISOString(),
      finalAttendance: [],
    });
    expect(res.status).toBe(404);
    expect(res.body.responseCode).toBe("PERIOD_NOT_FOUND");
  });

  it("returns 400 INVALID_PAYLOAD for a malformed finalAttendance entry", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await post({
      periodId: report.periodId,
      facultyLockedAt: new Date().toISOString(),
      finalAttendance: [{ rollNo: "21CS001", finalStatus: "MAYBE" }],
    });
    expect(res.status).toBe(400);
    expect(res.body.responseCode).toBe("INVALID_PAYLOAD");
  });

  it("returns 409 SYNC_ALREADY_APPLIED for a duplicate push with the same facultyLockedAt", async () => {
    const report = await AttendanceReport.create(baseReport());
    const payload = {
      periodId: report.periodId,
      facultyLockedAt: "2026-07-09T18:42:10+05:30",
      finalAttendance: [{ rollNo: "21CS001", finalStatus: "PRESENT", remarks: null }],
    };
    const first = await post(payload);
    expect(first.status).toBe(200);

    const second = await post(payload);
    expect(second.status).toBe(409);
    expect(second.body.responseCode).toBe("SYNC_ALREADY_APPLIED");
  });

  it("re-applies when facultyLockedAt differs (a genuine re-finalisation)", async () => {
    const report = await AttendanceReport.create(baseReport());
    await post({
      periodId: report.periodId,
      facultyLockedAt: "2026-07-09T18:42:10+05:30",
      finalAttendance: [{ rollNo: "21CS001", finalStatus: "PRESENT", remarks: null }],
    });
    const second = await post({
      periodId: report.periodId,
      facultyLockedAt: "2026-07-09T19:10:00+05:30",
      finalAttendance: [{ rollNo: "21CS001", finalStatus: "ABSENT", remarks: "Late correction" }],
    });
    expect(second.status).toBe(200);

    const updated = await AttendanceReport.findById(report._id);
    const s1 = updated.finalReport.find((s) => s.rollNo === "21CS001");
    expect(s1.erpOverriddenStatus).toBe("A");
    expect(s1.facultyRemark).toBe("Late correction");
  });
});

describe("POST /erp/faculty-override-sync — IP allowlist", () => {
  it("rejects a request when ERP_INBOUND_IP_ALLOWLIST is set and the caller isn't on it", async () => {
    process.env.ERP_INBOUND_IP_ALLOWLIST = "10.0.0.1,10.0.0.2";
    const report = await AttendanceReport.create(baseReport());
    const res = await post({
      periodId: report.periodId,
      facultyLockedAt: new Date().toISOString(),
      finalAttendance: [],
    });
    expect(res.status).toBe(403);
  });
});

jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const AttendanceReport = require("../../src/models/attendanceReport");

const BASE = "/api/v1/attendancemodule/reports";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

function baseReport(overrides = {}) {
  return {
    batch: "BTECH_CSE_2027",
    department: "CSE",
    date: "2026-07-09",
    timeSlot: "09:00-10:00",
    status: "draft",
    finalReport: [{ rollNo: "21CS001", finalStatus: "P" }],
    summary: { totalStudents: 1, present: 1, absent: 0, review: 0, attendancePct: 100 },
    ...overrides,
  };
}

describe("GET /reports", () => {
  it("lists and filters seeded reports by batch", async () => {
    await AttendanceReport.create(baseReport());
    await AttendanceReport.create(baseReport({ batch: "BTECH_ECE_2027", date: "2026-07-08" }));

    const res = await request(app)
      .get(`${BASE}?batch=BTECH_CSE_2027`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.reports[0].batch).toBe("BTECH_CSE_2027");
  });
});

describe("GET /reports/:id", () => {
  it("returns the full report detail", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app).get(`${BASE}/${report._id}`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.finalReport[0].rollNo).toBe("21CS001");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .get(`${BASE}/64f000000000000000000000`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(404);
  });
});

describe("POST /reports/:id/finalize", () => {
  it("transitions draft -> finalized", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app).post(`${BASE}/${report._id}/finalize`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    const updated = await AttendanceReport.findById(report._id);
    expect(updated.status).toBe("finalized");
  });

  it("rejects finalizing an already-finalized report", async () => {
    const report = await AttendanceReport.create(baseReport({ status: "finalized" }));
    const res = await request(app).post(`${BASE}/${report._id}/finalize`).set("Cookie", authCookie());
    expect(res.status).toBe(400);
  });
});

describe("PATCH /reports/:id/student/:rollNo (unauthenticated ERP override)", () => {
  it("updates a student's final status with no auth cookie at all", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001`)
      .send({ finalStatus: "A" }); // deliberately no .set("Cookie", ...)
    expect(res.status).toBe(200);

    const updated = await AttendanceReport.findById(report._id);
    const student = updated.finalReport.find((s) => s.rollNo === "21CS001");
    expect(student.finalStatus).toBe("A");
    expect(student.isOverridden).toBe(true);
    expect(updated.summary.present).toBe(0);
    expect(updated.summary.absent).toBe(1);
  });

  it("returns 404 for an unknown report id", async () => {
    const res = await request(app)
      .patch(`${BASE}/64f000000000000000000000/student/21CS001`)
      .send({ finalStatus: "A" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a roll number not in the report", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/99CS999`)
      .send({ finalStatus: "A" });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid finalStatus value", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001`)
      .send({ finalStatus: "X" });
    expect(res.status).toBe(400);
  });
});

describe("unique batch+date+timeSlot index", () => {
  it("rejects a duplicate report for the same batch/date/timeSlot", async () => {
    await AttendanceReport.create(baseReport());
    await expect(AttendanceReport.create(baseReport())).rejects.toThrow(/duplicate key/i);
  });
});

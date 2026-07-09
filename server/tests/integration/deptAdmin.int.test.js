jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const AttendanceReport = require("../../src/models/attendanceReport");
const User = require("../../src/models/usermanagement/user");

const BASE = "/api/v1/attendancemodule/dept-admin";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

describe("GET /dept-admin/context", () => {
  it("gives an admin full access with no locked department", async () => {
    const res = await request(app).get(`${BASE}/context`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.fullAccess).toBe(true);
    expect(res.body.department).toBeNull();
  });

  it("gives a dept-admin their own locked department", async () => {
    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["d@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(`${BASE}/context`)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(200);
    expect(res.body.fullAccess).toBe(false);
    expect(res.body.department).toBe("CSE");
  });
});

describe("GET /dept-admin/stats/today", () => {
  it("returns empty-DB shape with no reports today", async () => {
    const res = await request(app).get(`${BASE}/stats/today`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.sessions).toBe(0);
    expect(res.body.attendancePct).toBeNull();
  });

  it("aggregates today's seeded reports for an admin (institute-wide)", async () => {
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027",
      department: "CSE",
      semester: "5",
      date: todayStr(),
      timeSlot: "09:00-10:00",
      summary: { totalStudents: 10, present: 8, absent: 1, review: 1, attendancePct: 80 },
    });

    const res = await request(app).get(`${BASE}/stats/today`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.sessions).toBe(1);
    expect(res.body.present).toBe(8);
    expect(res.body.attendancePct).toBe(80);
  });

  it("scopes a dept-admin's stats to only their own department", async () => {
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027",
      department: "CSE",
      date: todayStr(),
      timeSlot: "09:00-10:00",
      summary: { totalStudents: 10, present: 8, absent: 2, review: 0, attendancePct: 80 },
    });
    await AttendanceReport.create({
      batch: "BTECH_ECE_2027",
      department: "ECE",
      date: todayStr(),
      timeSlot: "10:00-11:00",
      summary: { totalStudents: 10, present: 5, absent: 5, review: 0, attendancePct: 50 },
    });

    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["d@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(`${BASE}/stats/today`)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(200);
    expect(res.body.sessions).toBe(1);
    expect(res.body.present).toBe(8);
  });
});

describe("GET /dept-admin/reports", () => {
  it("filters reports to the dept-admin's own department", async () => {
    await AttendanceReport.create({
      batch: "BTECH_CSE_2027",
      department: "CSE",
      date: "2026-07-01",
      timeSlot: "09:00-10:00",
      summary: { totalStudents: 5, present: 4, absent: 1, review: 0, attendancePct: 80 },
    });
    await AttendanceReport.create({
      batch: "BTECH_ECE_2027",
      department: "ECE",
      date: "2026-07-01",
      timeSlot: "09:00-10:00",
      summary: { totalStudents: 5, present: 3, absent: 2, review: 0, attendancePct: 60 },
    });

    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["d@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(`${BASE}/reports`)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(res.body.reports[0].department).toBe("CSE");
  });
});

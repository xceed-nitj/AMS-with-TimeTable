jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const mongoose = require("mongoose");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const User = require("../../src/models/usermanagement/user");

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

// GET /settings/notifications: gated by attendanceRoleAccess only.
// GET /reports: gated by attendanceRoleAccess + enforceAttendanceDepartment.
const NOTIF_URL = "/api/v1/attendancemodule/settings/notifications";
const REPORTS_URL = "/api/v1/attendancemodule/reports";

describe("auth gate", () => {
  it("rejects with 401 when no cookie is sent", async () => {
    const res = await request(app).get(NOTIF_URL);
    expect(res.status).toBe(401);
  });

  it("rejects with 401 for a garbage/invalid token", async () => {
    const res = await request(app).get(NOTIF_URL).set("Cookie", ["jwt=not-a-real-token"]);
    expect(res.status).toBe(401);
  });

  it("rejects with 403 for a role outside iams-admin/iams-dept-admin", async () => {
    const res = await request(app).get(NOTIF_URL).set("Cookie", authCookie(["student"]));
    expect(res.status).toBe(403);
  });

  it("allows iams-admin full access", async () => {
    const res = await request(app).get(NOTIF_URL).set("Cookie", authCookie(["iams-admin"]));
    expect(res.status).toBe(200);
  });

  it("allows the bare 'admin' role (checkRole bypass) full access too", async () => {
    const res = await request(app).get(NOTIF_URL).set("Cookie", authCookie(["admin"]));
    expect(res.status).toBe(200);
  });

  it("rejects iams-dept-admin with no matching User/department", async () => {
    const res = await request(app).get(REPORTS_URL).set("Cookie", authCookie(["iams-dept-admin"]));
    expect(res.status).toBe(403);
  });

  it("allows iams-dept-admin once a User doc with a department exists", async () => {
    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["dept@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(REPORTS_URL)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(200);
  });

  it("rejects a dept-admin querying a department that isn't their own", async () => {
    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["dept@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(`${REPORTS_URL}?dept=ECE`)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Department access denied/);
  });

  it("rejects a dept-admin querying a batch belonging to a different department", async () => {
    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["dept@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(`${REPORTS_URL}?batch=BTECH_ECE_2027`)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Batch access denied/);
  });

  it("allows a dept-admin querying their own department's batch", async () => {
    const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: ["dept@x.com"], dept: "CSE" });
    const res = await request(app)
      .get(`${REPORTS_URL}?batch=BTECH_CSE_2027`)
      .set("Cookie", authCookie(["iams-dept-admin"], user._id.toString()));
    expect(res.status).toBe(200);
  });
});

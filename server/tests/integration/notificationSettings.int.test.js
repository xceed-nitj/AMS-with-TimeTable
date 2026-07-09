jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");

const BASE = "/api/v1/attendancemodule/settings/notifications";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

describe("notification settings", () => {
  it("GET / creates the singleton with 3 default roles on first access", async () => {
    const res = await request(app).get(BASE).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.settings.roles.map((r) => r.role).sort()).toEqual(["admin", "coordinator", "head"]);
    expect(res.body.settings.enabled).toBe(false);
  });

  it("PUT / toggles enabled", async () => {
    await request(app).get(BASE).set("Cookie", authCookie());
    const res = await request(app).put(BASE).set("Cookie", authCookie()).send({ enabled: true });
    expect(res.status).toBe(200);
    expect(res.body.settings.enabled).toBe(true);
  });

  it("PUT /roles/:role updates that role's alertTypes", async () => {
    const res = await request(app)
      .put(`${BASE}/roles/admin`)
      .set("Cookie", authCookie())
      .send({ alertTypes: { serverDown: true, classBunk: "yes" } });
    expect(res.status).toBe(200);
    const admin = res.body.settings.roles.find((r) => r.role === "admin");
    expect(admin.alertTypes.serverDown).toBe(true);
    expect(admin.alertTypes.classBunk).toBe(true);
    expect(admin.alertTypes.lowConfidence).toBe(false);
  });

  it("PUT /roles/:role rejects an invalid role", async () => {
    const res = await request(app)
      .put(`${BASE}/roles/superadmin`)
      .set("Cookie", authCookie())
      .send({ alertTypes: {} });
    expect(res.status).toBe(400);
  });

  it("POST /recipients rejects a missing email", async () => {
    const res = await request(app)
      .post(`${BASE}/recipients`)
      .set("Cookie", authCookie())
      .send({ role: "admin" });
    expect(res.status).toBe(400);
  });

  it("POST /recipients rejects an invalid role enum", async () => {
    const res = await request(app)
      .post(`${BASE}/recipients`)
      .set("Cookie", authCookie())
      .send({ email: "a@b.com", role: "superadmin" });
    expect(res.status).toBe(400);
  });

  it("POST /recipients requires dept for coordinator/head roles", async () => {
    const res = await request(app)
      .post(`${BASE}/recipients`)
      .set("Cookie", authCookie())
      .send({ email: "a@b.com", role: "coordinator" });
    expect(res.status).toBe(400);
  });

  it("adds a recipient and then removes it", async () => {
    const addRes = await request(app)
      .post(`${BASE}/recipients`)
      .set("Cookie", authCookie())
      .send({ email: "admin@x.com", role: "admin" });
    expect(addRes.status).toBe(200);
    const added = addRes.body.settings.recipients.find((r) => r.email === "admin@x.com");
    expect(added).toBeDefined();

    const delRes = await request(app)
      .delete(`${BASE}/recipients/${added._id}`)
      .set("Cookie", authCookie());
    expect(delRes.status).toBe(200);
    expect(delRes.body.settings.recipients.find((r) => r.email === "admin@x.com")).toBeUndefined();
  });
});

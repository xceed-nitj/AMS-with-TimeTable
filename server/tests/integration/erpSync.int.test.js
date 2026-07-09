jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");

const BASE = "/api/v1/attendancemodule/erp-sync";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

describe("erp-sync settings singleton", () => {
  it("GET /settings creates the singleton on first access (enabled defaults true)", async () => {
    const res = await request(app).get(`${BASE}/settings`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
  });

  it("PATCH /settings toggles enabled", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);

    const getRes = await request(app).get(`${BASE}/settings`).set("Cookie", authCookie());
    expect(getRes.body.enabled).toBe(false);
  });

  it("PATCH /settings rejects a non-boolean enabled value", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ enabled: "yes" });
    expect(res.status).toBe(400);
  });
});

describe("ERP not configured (ERP_API_URL unset in test env)", () => {
  it("rejects /fetch-rolls with 503", async () => {
    const res = await request(app)
      .post(`${BASE}/fetch-rolls`)
      .set("Cookie", authCookie())
      .send({ subjectId: "64f000000000000000000000" });
    expect(res.status).toBe(503);
  });

  it("rejects /fetch-rolls-bulk with 503", async () => {
    const res = await request(app)
      .post(`${BASE}/fetch-rolls-bulk`)
      .set("Cookie", authCookie())
      .send({ dept: "CSE" });
    expect(res.status).toBe(503);
  });
});

describe("GET /subjects", () => {
  it("requires a dept query param", async () => {
    const res = await request(app).get(`${BASE}/subjects`).set("Cookie", authCookie());
    expect(res.status).toBe(400);
  });

  it("reports erpConfigured:false in the response when ERP_API_URL is unset", async () => {
    const res = await request(app)
      .get(`${BASE}/subjects?dept=CSE`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.erpConfigured).toBe(false);
    expect(res.body.subjects).toEqual([]);
  });
});

jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");

const BASE = "/api/v1/attendancemodule/erp-push";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

describe("GET/PATCH /erp-push/settings — admin-editable retry policy", () => {
  it("GET creates the singleton with default retry policy", async () => {
    const res = await request(app).get(`${BASE}/settings`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      enabled: true,
      maxAttempts: 2,
      retryIntervalMinutes: 3,
      nightlyRetryEnabled: true,
    });
  });

  it("PATCH updates maxAttempts and retryIntervalMinutes independently of enabled", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ maxAttempts: 5, retryIntervalMinutes: 15 });
    expect(res.status).toBe(200);
    expect(res.body.maxAttempts).toBe(5);
    expect(res.body.retryIntervalMinutes).toBe(15);
    expect(res.body.enabled).toBe(true); // untouched

    const getRes = await request(app).get(`${BASE}/settings`).set("Cookie", authCookie());
    expect(getRes.body.maxAttempts).toBe(5);
    expect(getRes.body.retryIntervalMinutes).toBe(15);
  });

  it("PATCH toggles nightlyRetryEnabled", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ nightlyRetryEnabled: false });
    expect(res.status).toBe(200);
    expect(res.body.nightlyRetryEnabled).toBe(false);
  });

  it("rejects a non-integer maxAttempts", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ maxAttempts: 2.5 });
    expect(res.status).toBe(400);
  });

  it("rejects a maxAttempts outside 1-20", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ maxAttempts: 50 });
    expect(res.status).toBe(400);
  });

  it("rejects a retryIntervalMinutes outside 1-1440", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({ retryIntervalMinutes: 0 });
    expect(res.status).toBe(400);
  });

  it("rejects an empty body", async () => {
    const res = await request(app)
      .patch(`${BASE}/settings`)
      .set("Cookie", authCookie())
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /erp-push/sync-all", () => {
  it("returns a summary with zero candidates when nothing is pending", async () => {
    const res = await request(app).post(`${BASE}/sync-all`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0, sent: 0, failed: 0, skipped: 0 });
  });
});

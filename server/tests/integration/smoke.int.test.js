// Proves the harness end-to-end: express app boots, mongodb-memory-server
// connects, JWT-cookie auth gate works, and the healthRoutes require-time
// interval fix (R4) doesn't leave an open handle.
jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const axios = require("axios");
const mlServiceClient = require("../../src/modules/attendanceModule/controllers/mlServiceClient");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(async () => {
  await disconnect();
});

describe("smoke", () => {
  it("returns 200 for an authenticated admin on /health/status", async () => {
    mlServiceClient.getTargetInfo.mockReturnValue({
      kind: "local", label: "Local ML service", host: "localhost", port: "8500", display: "localhost:8500",
    });
    mlServiceClient.healthCheck.mockResolvedValue({ status: "ok" });
    axios.get.mockResolvedValue({ data: {} });

    const res = await request(app)
      .get("/api/v1/attendancemodule/health/status")
      .set("Cookie", authCookie());

    expect(res.status).toBe(200);
  });

  it("returns 401 with no auth cookie", async () => {
    const res = await request(app).get("/api/v1/attendancemodule/health/status");
    expect(res.status).toBe(401);
  });
});

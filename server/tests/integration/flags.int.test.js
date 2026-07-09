jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const ClusterMatch = require("../../src/models/attendanceModule/clusterMatch");

const BASE = "/api/v1/attendancemodule/flags";
// Test-only batch name so cleanup can safely rm -rf just this folder
// under the real ground_truth dir (rollAssignController creates that dir at
// import time; we don't want to touch any other batch's data).
const TEST_BATCH = "BTECH_TESTFLAGS_2099";
const GROUND_TRUTH_DIR = path.join(__dirname, "..", "..", "ml-data", "ground_truth");
const BATCH_DIR = path.join(GROUND_TRUTH_DIR, TEST_BATCH);

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(async () => {
  await disconnect();
  fs.rmSync(BATCH_DIR, { recursive: true, force: true });
});

describe("POST /flags/flag", () => {
  it("requires batch and folderName", async () => {
    const res = await request(app).post(`${BASE}/flag`).set("Cookie", authCookie()).send({});
    expect(res.status).toBe(400);
  });

  it("flags a cluster and marks the ClusterMatch record flagged", async () => {
    await ClusterMatch.create({ batch: TEST_BATCH, folderName: "person_001", status: "matched" });

    const res = await request(app)
      .post(`${BASE}/flag`)
      .set("Cookie", authCookie())
      .send({ batch: TEST_BATCH, folderName: "person_001", reason: "wrong_match" });
    expect(res.status).toBe(200);

    const updated = await ClusterMatch.findOne({ batch: TEST_BATCH, folderName: "person_001" });
    expect(updated.status).toBe("flagged");
    expect(updated.approved).toBe(false);
  });
});

describe("GET /flags/flagged/:batch", () => {
  it("returns 404 for a batch with no ground-truth folder", async () => {
    const res = await request(app)
      .get(`${BASE}/flagged/BTECH_NOSUCHBATCH_2099`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(404);
  });

  it("lists an open (unresolved) flag after flagging", async () => {
    await ClusterMatch.create({ batch: TEST_BATCH, folderName: "person_002", status: "matched" });
    await request(app)
      .post(`${BASE}/flag`)
      .set("Cookie", authCookie())
      .send({ batch: TEST_BATCH, folderName: "person_002" });

    const res = await request(app).get(`${BASE}/flagged/${TEST_BATCH}`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.flagged.some((f) => f.folderName === "person_002" && !f.resolved)).toBe(true);
  });
});

describe("POST /flags/resolve-flag", () => {
  it("requires batch, folderName and rollNo", async () => {
    const res = await request(app)
      .post(`${BASE}/resolve-flag`)
      .set("Cookie", authCookie())
      .send({ batch: TEST_BATCH });
    expect(res.status).toBe(400);
  });

  it("resolves a flagged cluster and approves the ClusterMatch record", async () => {
    await ClusterMatch.create({ batch: TEST_BATCH, folderName: "person_003", status: "matched" });
    await request(app)
      .post(`${BASE}/flag`)
      .set("Cookie", authCookie())
      .send({ batch: TEST_BATCH, folderName: "person_003" });

    const res = await request(app)
      .post(`${BASE}/resolve-flag`)
      .set("Cookie", authCookie())
      .send({ batch: TEST_BATCH, folderName: "person_003", rollNo: "21cs003" });
    expect(res.status).toBe(200);
    expect(res.body.rollNo).toBe("21CS003");

    const updated = await ClusterMatch.findOne({ batch: TEST_BATCH, folderName: "person_003" });
    expect(updated.status).toBe("approved");
    expect(updated.approved).toBe(true);

    const flaggedRes = await request(app).get(`${BASE}/flagged/${TEST_BATCH}`).set("Cookie", authCookie());
    expect(flaggedRes.body.flagged.find((f) => f.folderName === "person_003")).toBeUndefined();
  });
});

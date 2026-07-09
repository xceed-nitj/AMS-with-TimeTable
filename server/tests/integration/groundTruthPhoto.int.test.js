jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");

const GROUND_TRUTH_DIR = path.join(__dirname, "..", "..", "ml-data", "ground_truth");
const TEST_BATCH = "BTECH_TESTPHOTO_2099";
const BATCH_DIR = path.join(GROUND_TRUTH_DIR, TEST_BATCH);
const STUDENT_DIR = path.join(BATCH_DIR, "21CS999_Test_Student");

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();

  fs.mkdirSync(STUDENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(STUDENT_DIR, "photo.jpg"), Buffer.from("fake-jpeg-bytes"));
});
afterEach(clearDatabase);
afterAll(async () => {
  await disconnect();
  fs.rmSync(BATCH_DIR, { recursive: true, force: true });
});

describe("GET /ground-truth-photo-by-roll/:rollNo (unauthenticated)", () => {
  it("returns a base64 photo with no auth cookie, matching folder by roll prefix", async () => {
    const res = await request(app).get(
      "/api/v1/attendancemodule/ground-truth-photo-by-roll/21CS999",
    ); // deliberately no .set("Cookie", ...)
    expect(res.status).toBe(200);
    expect(res.body.photo).toBe(Buffer.from("fake-jpeg-bytes").toString("base64"));
  });

  it("returns an empty photo for an unknown roll number", async () => {
    const res = await request(app).get(
      "/api/v1/attendancemodule/ground-truth-photo-by-roll/99CS000",
    );
    expect(res.status).toBe(200);
    expect(res.body.photo).toBe("");
  });

  it("returns an empty photo for an empty roll number segment", async () => {
    const res = await request(app).get("/api/v1/attendancemodule/ground-truth-photo-by-roll/%20");
    expect(res.status).toBe(200);
    expect(res.body.photo).toBe("");
  });
});

jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const {
  saveFrameSnapshot,
  ANNOTATED_DIR,
} = require("../../src/modules/attendanceModule/controllers/frameSnapshotWriter");

const BASE = "/api/v1/attendancemodule/frame-verification";
const FOLDER = "TESTROOM_PERIOD1_20260709";
const folderPath = path.join(ANNOTATED_DIR, FOLDER);

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(async () => {
  await clearDatabase();
  fs.rmSync(folderPath, { recursive: true, force: true });
});
afterAll(disconnect);

describe("GET /frame-verification/frames — rolls sidecar", () => {
  it("returns rolls + facesCount, tolerating both old int and new object sidecar formats", async () => {
    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(path.join(folderPath, "frame_0000s_cam1.jpg"), Buffer.from([0xff, 0xd8, 0xff]));
    fs.writeFileSync(path.join(folderPath, "frame_0015s_cam1.jpg"), Buffer.from([0xff, 0xd8, 0xff]));
    fs.writeFileSync(
      path.join(folderPath, "_faces.json"),
      JSON.stringify({
        "frame_0000s_cam1.jpg": 3, // legacy plain-int
        "frame_0015s_cam1.jpg": { faces: 2, rolls: ["21CS001"] }, // current
      }),
    );

    const res = await request(app)
      .get(`${BASE}/frames?room=TESTROOM&date=2026-07-09&period=period1`)
      .set("Cookie", authCookie());

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    const byName = Object.fromEntries(res.body.annotatedFrames.map((f) => [f.filename, f]));
    expect(byName["frame_0000s_cam1.jpg"].rolls).toEqual([]);
    expect(byName["frame_0000s_cam1.jpg"].facesCount).toBe(3);
    expect(byName["frame_0015s_cam1.jpg"].rolls).toEqual(["21CS001"]);
    expect(byName["frame_0015s_cam1.jpg"].facesCount).toBe(2);
  });
});

describe("saveFrameSnapshot — sidecar merge", () => {
  it("writes the { faces, rolls } object format and preserves a pre-existing int entry", () => {
    fs.mkdirSync(folderPath, { recursive: true });
    // Pre-existing legacy entry from an older run.
    fs.writeFileSync(
      path.join(folderPath, "_faces.json"),
      JSON.stringify({ "frame_0000s_cam1.jpg": 3 }),
    );

    saveFrameSnapshot({
      folder: FOLDER,
      filename: "frame_0015s_cam1.jpg",
      annotated_data: Buffer.from([0xff, 0xd8, 0xff]).toString("base64"),
      faces_count: 2,
      rolls: ["21CS001", "21CS002"],
    });

    const sidecar = JSON.parse(fs.readFileSync(path.join(folderPath, "_faces.json"), "utf8"));
    expect(sidecar["frame_0000s_cam1.jpg"]).toBe(3); // untouched legacy value
    expect(sidecar["frame_0015s_cam1.jpg"]).toEqual({ faces: 2, rolls: ["21CS001", "21CS002"] });
  });

  it("defaults rolls to an empty array when the event carries none", () => {
    saveFrameSnapshot({
      folder: FOLDER,
      filename: "frame_0000s_cam1.jpg",
      annotated_data: Buffer.from([0xff, 0xd8, 0xff]).toString("base64"),
      faces_count: 5,
    });

    const sidecar = JSON.parse(fs.readFileSync(path.join(folderPath, "_faces.json"), "utf8"));
    expect(sidecar["frame_0000s_cam1.jpg"]).toEqual({ faces: 5, rolls: [] });
  });
});

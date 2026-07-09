jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const MasterRoom = require("../../src/models/masterroom");
const Camera = require("../../src/models/attendanceModule/camera");

const BASE = "/api/v1/attendancemodule/cameras";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

function cameraPayload(overrides = {}) {
  return {
    cameraId: "CAM1",
    roomId: "R101",
    position: "front-left",
    streamUrl: "rtsp://example/cam1",
    protocol: "rtsp",
    ipAddress: "10.0.0.1",
    port: 554,
    ...overrides,
  };
}

describe("cameras CRUD", () => {
  it("creates a camera once its room resolves to a building", async () => {
    await MasterRoom.create({ room: "R101", type: "classroom", building: "Block A" });
    const res = await request(app).post(BASE).set("Cookie", authCookie()).send(cameraPayload());
    expect(res.status).toBe(201);
    expect(res.body.building).toBe("Block A");
  });

  it("rejects creating a camera for a room with no matching MasterRoom entry", async () => {
    const res = await request(app).post(BASE).set("Cookie", authCookie()).send(cameraPayload());
    expect(res.status).toBe(400);
  });

  it("rejects creating a camera with no roomId", async () => {
    const res = await request(app)
      .post(BASE)
      .set("Cookie", authCookie())
      .send(cameraPayload({ roomId: undefined }));
    expect(res.status).toBe(400);
  });

  it("lists cameras sorted by room/position", async () => {
    await MasterRoom.create({ room: "R101", type: "classroom", building: "Block A" });
    await request(app).post(BASE).set("Cookie", authCookie()).send(cameraPayload());

    const res = await request(app).get(BASE).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cameraId).toBe("CAM1");
  });

  it("updates a camera by id", async () => {
    await MasterRoom.create({ room: "R101", type: "classroom", building: "Block A" });
    const camera = await Camera.create({ ...cameraPayload(), building: "Block A" });

    const res = await request(app)
      .patch(`${BASE}/${camera._id}`)
      .set("Cookie", authCookie())
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it("rejects a duplicate cameraId (unique index)", async () => {
    await MasterRoom.create({ room: "R101", type: "classroom", building: "Block A" });
    await Camera.create({ ...cameraPayload(), building: "Block A" });

    const res = await request(app).post(BASE).set("Cookie", authCookie()).send(cameraPayload());
    expect(res.status).toBe(409);
  });

  it("deletes a camera by id", async () => {
    await MasterRoom.create({ room: "R101", type: "classroom", building: "Block A" });
    const camera = await Camera.create({ ...cameraPayload(), building: "Block A" });

    const res = await request(app).delete(`${BASE}/${camera._id}`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(await Camera.findById(camera._id)).toBeNull();
  });

  it("returns 404 deleting an unknown camera", async () => {
    const res = await request(app)
      .delete(`${BASE}/64f000000000000000000000`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(404);
  });
});

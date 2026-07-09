jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");

const BASE = "/api/v1/attendancemodule/settings/batches";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

describe("batch settings CRUD", () => {
  it("creates a batch and lists it back sorted by year desc", async () => {
    await request(app).post(BASE).set("Cookie", authCookie()).send({ batchYear: "2026" });
    await request(app).post(BASE).set("Cookie", authCookie()).send({ batchYear: "2027" });

    const res = await request(app).get(BASE).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.batches.map((b) => b.batchYear)).toEqual(["2027", "2026"]);
  });

  it("rejects creating a batch without a batchYear", async () => {
    const res = await request(app).post(BASE).set("Cookie", authCookie()).send({});
    expect(res.status).toBe(400);
  });

  it("rejects creating a duplicate batchYear", async () => {
    await request(app).post(BASE).set("Cookie", authCookie()).send({ batchYear: "2026" });
    const res = await request(app).post(BASE).set("Cookie", authCookie()).send({ batchYear: "2026" });
    expect(res.status).toBe(409);
  });

  it("updates and deletes a batch", async () => {
    const createRes = await request(app).post(BASE).set("Cookie", authCookie()).send({ batchYear: "2026" });
    const id = createRes.body.batch._id;

    const updateRes = await request(app)
      .put(`${BASE}/${id}`)
      .set("Cookie", authCookie())
      .send({ batchYear: "2028" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.batch.batchYear).toBe("2028");

    const deleteRes = await request(app).delete(`${BASE}/${id}`).set("Cookie", authCookie());
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get(BASE).set("Cookie", authCookie());
    expect(listRes.body.batches).toHaveLength(0);
  });

  it("returns 404 when updating a batch that doesn't exist", async () => {
    const res = await request(app)
      .put(`${BASE}/64f000000000000000000000`)
      .set("Cookie", authCookie())
      .send({ batchYear: "2030" });
    expect(res.status).toBe(404);
  });
});

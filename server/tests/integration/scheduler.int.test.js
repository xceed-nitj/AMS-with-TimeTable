jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const AcquisitionControl = require("../../src/models/acquisitionControl");
const Allotment = require("../../src/models/allotment");

const BASE = "/api/v1/attendancemodule/scheduler";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

describe("GET /scheduler/working-day", () => {
  it("returns 404 when no default AcquisitionControl config exists", async () => {
    const res = await request(app)
      .get(`${BASE}/working-day?date=2026-07-09`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(404);
  });

  it("returns isWorkingDay:true when the date isn't stopped or a non-working day", async () => {
    await AcquisitionControl.create({ profileName: "default", active: true, stoppedDays: [] });
    const res = await request(app)
      .get(`${BASE}/working-day?date=2026-07-09`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.isWorkingDay).toBe(true);
  });

  it("returns isWorkingDay:false for a manually stopped day", async () => {
    await AcquisitionControl.create({ profileName: "default", active: true, stoppedDays: ["2026-07-09"] });
    const res = await request(app)
      .get(`${BASE}/working-day?date=2026-07-09`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.isWorkingDay).toBe(false);
    expect(res.body.source).toBe("stoppedDays");
  });

  it("returns isWorkingDay:false for an institutional non-working day", async () => {
    await AcquisitionControl.create({ profileName: "default", active: true, stoppedDays: [] });
    await Allotment.create({
      session: "2026-27",
      nonWorkingDays: [{ date: "2026-07-09", remark: "Institute Holiday" }],
    });
    const res = await request(app)
      .get(`${BASE}/working-day?date=2026-07-09`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.isWorkingDay).toBe(false);
    expect(res.body.reason).toBe("Institute Holiday");
    expect(res.body.source).toBe("allotment");
  });
});

describe("GET /scheduler/non-working-days", () => {
  it("returns an empty list when no allotment has non-working days", async () => {
    const res = await request(app).get(`${BASE}/non-working-days`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.days).toEqual([]);
  });

  it("returns all non-working days sorted by date, across sessions", async () => {
    await Allotment.create({
      session: "2026-27",
      nonWorkingDays: [
        { date: "2026-08-15", remark: "Independence Day" },
        { date: "2026-01-26", remark: "Republic Day" },
      ],
    });

    const res = await request(app).get(`${BASE}/non-working-days`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.days.map((d) => d.date)).toEqual(["2026-01-26", "2026-08-15"]);
  });
});

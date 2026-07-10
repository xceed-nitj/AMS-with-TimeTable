jest.mock("axios");
jest.mock("../../src/modules/attendanceModule/controllers/mlServiceClient");

const request = require("supertest");
const { buildTestApp } = require("../helpers/testApp");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const { authCookie } = require("../helpers/auth");
const AttendanceReport = require("../../src/models/attendanceReport");
const User = require("../../src/models/usermanagement/user");
const Batch = require("../../src/models/attendanceModule/batch");

const BASE = "/api/v1/attendancemodule/reports";

let app;

beforeAll(async () => {
  await connect();
  app = buildTestApp();
});
afterEach(clearDatabase);
afterAll(disconnect);

function baseReport(overrides = {}) {
  return {
    batch: "BTECH_CSE_2027",
    department: "CSE",
    date: "2026-07-09",
    timeSlot: "09:00-10:00",
    status: "draft",
    finalReport: [{ rollNo: "21CS001", finalStatus: "P" }],
    summary: { totalStudents: 1, present: 1, absent: 0, review: 0, attendancePct: 100 },
    ...overrides,
  };
}

async function deptAdminCookie(dept) {
  const user = await User.create({ role: ["iams-dept-admin"], password: "x", email: [`${dept.toLowerCase()}@x.com`], dept });
  return authCookie(["iams-dept-admin"], user._id.toString());
}

async function enableErpOverrides() {
  await Batch.create({ batchYear: "2027", deptMenus: { erpOverrides: true } });
}

describe("GET /reports", () => {
  it("lists and filters seeded reports by batch", async () => {
    await AttendanceReport.create(baseReport());
    await AttendanceReport.create(baseReport({ batch: "BTECH_ECE_2027", date: "2026-07-08" }));

    const res = await request(app)
      .get(`${BASE}?batch=BTECH_CSE_2027`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.reports[0].batch).toBe("BTECH_CSE_2027");
  });
});

describe("GET /reports/:id", () => {
  it("returns the full report detail", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app).get(`${BASE}/${report._id}`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.finalReport[0].rollNo).toBe("21CS001");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .get(`${BASE}/64f000000000000000000000`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(404);
  });
});

describe("POST /reports/:id/finalize", () => {
  it("transitions draft -> finalized", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app).post(`${BASE}/${report._id}/finalize`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    const updated = await AttendanceReport.findById(report._id);
    expect(updated.status).toBe("finalized");
  });

  it("rejects finalizing an already-finalized report", async () => {
    const report = await AttendanceReport.create(baseReport({ status: "finalized" }));
    const res = await request(app).post(`${BASE}/${report._id}/finalize`).set("Cookie", authCookie());
    expect(res.status).toBe(400);
  });
});

describe("PATCH /reports/:id/student/:rollNo (unauthenticated ERP override)", () => {
  it("updates a student's final status with no auth cookie at all", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001`)
      .send({ finalStatus: "A" }); // deliberately no .set("Cookie", ...)
    expect(res.status).toBe(200);

    const updated = await AttendanceReport.findById(report._id);
    const student = updated.finalReport.find((s) => s.rollNo === "21CS001");
    expect(student.finalStatus).toBe("A");
    expect(student.isOverridden).toBe(true);
    expect(updated.summary.present).toBe(0);
    expect(updated.summary.absent).toBe(1);
  });

  it("returns 404 for an unknown report id", async () => {
    const res = await request(app)
      .patch(`${BASE}/64f000000000000000000000/student/21CS001`)
      .send({ finalStatus: "A" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a roll number not in the report", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/99CS999`)
      .send({ finalStatus: "A" });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid finalStatus value", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001`)
      .send({ finalStatus: "X" });
    expect(res.status).toBe(400);
  });

  it("stores the faculty's remark, forwarded from ERP with the same call", async () => {
    const report = await AttendanceReport.create(baseReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001`)
      .send({ finalStatus: "A", remark: "Student came late" });
    expect(res.status).toBe(200);

    const updated = await AttendanceReport.findById(report._id);
    const student = updated.finalReport.find((s) => s.rollNo === "21CS001");
    expect(student.facultyRemark).toBe("Student came late");
  });
});

describe("GET /reports/erp-overrides", () => {
  function overriddenReport(overrides = {}) {
    return baseReport({
      finalReport: [
        {
          rollNo: "21CS001",
          finalStatus: "A",
          autoFinalStatus: "P",
          isOverridden: true,
        },
      ],
      ...overrides,
    });
  }

  it("lets a full-access role see overrides across all departments", async () => {
    await AttendanceReport.create(overriddenReport());
    await AttendanceReport.create(
      overriddenReport({ batch: "BTECH_ECE_2027", department: "ECE", date: "2026-07-08" }),
    );

    const res = await request(app).get(`${BASE}/erp-overrides`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it("scopes a dept-admin to their own department with no department query param", async () => {
    await enableErpOverrides();
    await AttendanceReport.create(overriddenReport());
    await AttendanceReport.create(
      overriddenReport({ batch: "BTECH_ECE_2027", department: "ECE", date: "2026-07-08" }),
    );

    const res = await request(app)
      .get(`${BASE}/erp-overrides`)
      .set("Cookie", await deptAdminCookie("CSE"));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].department).toBe("CSE");
  });

  it("filters by semester and faculty", async () => {
    await AttendanceReport.create(overriddenReport({ semester: "5", faculty: "Dr. A" }));
    await AttendanceReport.create(
      overriddenReport({ semester: "3", faculty: "Dr. B", date: "2026-07-08" }),
    );

    const res = await request(app)
      .get(`${BASE}/erp-overrides?semester=5&faculty=${encodeURIComponent("Dr. A")}`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].faculty).toBe("Dr. A");
  });

  it("includes facultyRemark, coordinatorRemark and coordinatorVerified on each override", async () => {
    await AttendanceReport.create(
      overriddenReport({
        finalReport: [
          {
            rollNo: "21CS001",
            finalStatus: "A",
            autoFinalStatus: "P",
            isOverridden: true,
            facultyRemark: "Student came late",
          },
        ],
      }),
    );

    const res = await request(app).get(`${BASE}/erp-overrides`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    const [override] = res.body.items[0].overrides;
    expect(override.facultyRemark).toBe("Student came late");
    expect(override.coordinatorRemark).toBe("");
    expect(override.coordinatorVerified).toBe(false);
  });
});

describe("GET /reports/erp-overrides — overview stats & departments", () => {
  // Two CSE reports (3 overridden students, 1 verified) + one ECE report
  // (1 overridden student, unverified).
  async function seedMixed() {
    await AttendanceReport.create(
      baseReport({
        finalReport: [
          { rollNo: "21CS001", finalStatus: "A", autoFinalStatus: "P", isOverridden: true, coordinatorVerified: true, coordinatorRemark: "Student came late" },
          { rollNo: "21CS002", finalStatus: "A", autoFinalStatus: "P", isOverridden: true },
        ],
      }),
    );
    await AttendanceReport.create(
      baseReport({
        date: "2026-07-08",
        finalReport: [
          { rollNo: "21CS003", finalStatus: "P", autoFinalStatus: "A", isOverridden: true },
        ],
      }),
    );
    await AttendanceReport.create(
      baseReport({
        batch: "BTECH_ECE_2027",
        department: "ECE",
        date: "2026-07-07",
        finalReport: [
          { rollNo: "21EC001", finalStatus: "A", autoFinalStatus: "P", isOverridden: true },
        ],
      }),
    );
  }

  it("returns filter-wide stats and a sorted departments list for a full-access admin", async () => {
    await seedMixed();
    const res = await request(app).get(`${BASE}/erp-overrides`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({ sessions: 3, overriddenStudents: 4, verified: 1, unverified: 3 });
    expect(res.body.departments).toEqual(["CSE", "ECE"]);
  });

  it("scopes stats to ?department= but keeps the full departments list", async () => {
    await seedMixed();
    const res = await request(app).get(`${BASE}/erp-overrides?department=CSE`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({ sessions: 2, overriddenStudents: 3, verified: 1, unverified: 2 });
    expect(res.body.departments).toEqual(["CSE", "ECE"]);
  });

  it("scopes stats to a dept-admin's own department and omits the departments list", async () => {
    await enableErpOverrides();
    await seedMixed();
    const res = await request(app)
      .get(`${BASE}/erp-overrides`)
      .set("Cookie", await deptAdminCookie("CSE"));
    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({ sessions: 2, overriddenStudents: 3, verified: 1, unverified: 2 });
    expect(res.body.departments).toBeUndefined();
  });

  it("computes stats over the whole filter, ignoring pagination", async () => {
    await seedMixed();
    const res = await request(app).get(`${BASE}/erp-overrides?limit=1`).set("Cookie", authCookie());
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.stats.sessions).toBe(3);
    expect(res.body.stats.overriddenStudents).toBe(4);
  });
});

describe("PATCH /reports/:id/student/:rollNo/coordinator-remark", () => {
  function overriddenReport(overrides = {}) {
    return baseReport({
      finalReport: [
        {
          rollNo: "21CS001",
          finalStatus: "A",
          autoFinalStatus: "P",
          isOverridden: true,
        },
      ],
      ...overrides,
    });
  }

  it("rejects a value outside the fixed option list", async () => {
    const report = await AttendanceReport.create(overriddenReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001/coordinator-remark`)
      .set("Cookie", authCookie())
      .send({ coordinatorRemark: "Not a real option" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid option and flips coordinatorVerified", async () => {
    const report = await AttendanceReport.create(overriddenReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001/coordinator-remark`)
      .set("Cookie", authCookie())
      .send({ coordinatorRemark: "Student came late" });
    expect(res.status).toBe(200);

    const updated = await AttendanceReport.findById(report._id);
    const student = updated.finalReport.find((s) => s.rollNo === "21CS001");
    expect(student.coordinatorRemark).toBe("Student came late");
    expect(student.coordinatorVerified).toBe(true);
  });

  it("returns 403 for a dept-admin acting on a report outside their department", async () => {
    await enableErpOverrides();
    const report = await AttendanceReport.create(overriddenReport({ department: "ECE" }));
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001/coordinator-remark`)
      .set("Cookie", await deptAdminCookie("CSE"))
      .send({ coordinatorRemark: "Student came late" });
    expect(res.status).toBe(403);
  });

  it("lets a full-access role act on any department's report", async () => {
    const report = await AttendanceReport.create(overriddenReport({ department: "ECE" }));
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/21CS001/coordinator-remark`)
      .set("Cookie", authCookie())
      .send({ coordinatorRemark: "Lighting issues" });
    expect(res.status).toBe(200);
  });

  it("returns 404 for an unknown report id", async () => {
    const res = await request(app)
      .patch(`${BASE}/64f000000000000000000000/student/21CS001/coordinator-remark`)
      .set("Cookie", authCookie())
      .send({ coordinatorRemark: "Student came late" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a roll number not in the report", async () => {
    const report = await AttendanceReport.create(overriddenReport());
    const res = await request(app)
      .patch(`${BASE}/${report._id}/student/99CS999/coordinator-remark`)
      .set("Cookie", authCookie())
      .send({ coordinatorRemark: "Student came late" });
    expect(res.status).toBe(404);
  });
});

describe("unique batch+date+timeSlot index", () => {
  it("rejects a duplicate report for the same batch/date/timeSlot", async () => {
    await AttendanceReport.create(baseReport());
    await expect(AttendanceReport.create(baseReport())).rejects.toThrow(/duplicate key/i);
  });
});

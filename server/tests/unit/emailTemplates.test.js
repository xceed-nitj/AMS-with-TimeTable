const templates = require("../../src/modules/attendanceModule/controllers/emailTemplates");

describe("emailTemplates", () => {
  it("serverDownTemplate embeds the service name and details", () => {
    const html = templates.serverDownTemplate("ML Service", "connection refused");
    expect(html).toContain("ML Service");
    expect(html).toContain("connection refused");
  });

  it("serverDownTemplate omits the details block when none given", () => {
    const html = templates.serverDownTemplate("ML Service");
    expect(html).not.toContain("Details:");
  });

  it("noReportSavedTemplate embeds all session fields with fallbacks", () => {
    const html = templates.noReportSavedTemplate({
      batch: "BTECH_CSE_2027",
      subject: null,
      faculty: null,
      room: "R101",
      date: "2026-07-09",
      timeSlot: "09:00-10:00",
    });
    expect(html).toContain("BTECH_CSE_2027");
    expect(html).toContain("R101");
    expect(html).toContain("2026-07-09");
    expect(html).toContain("N/A"); // subject/faculty fallback
  });

  it("classBunkTemplate embeds total student count", () => {
    const html = templates.classBunkTemplate({
      batch: "BTECH_CSE_2027",
      subject: "DBMS",
      faculty: "Dr. X",
      room: "R101",
      date: "2026-07-09",
      timeSlot: "09:00-10:00",
      totalStudents: 42,
    });
    expect(html).toContain("42");
  });

  it("lowConfidenceTemplate formats confidence as a percentage", () => {
    const html = templates.lowConfidenceTemplate({
      batch: "BTECH_CSE_2027",
      rollNo: "21CS001",
      avgConfidence: 0.42,
    });
    expect(html).toContain("42%");
    expect(html).toContain("21CS001");
  });

  it("duplicateAttendanceTemplate lists every session", () => {
    const html = templates.duplicateAttendanceTemplate({
      rollNo: "21CS001",
      date: "2026-07-09",
      sessions: [
        { batch: "BTECH_CSE_2027", timeSlot: "09:00-10:00", room: "R101" },
        { batch: "BTECH_CSE_2027", timeSlot: "09:00-10:00", room: null },
      ],
    });
    expect(html).toContain("R101");
    expect(html).toContain("N/A");
  });

  it("dailySummaryTemplate groups rows by semester", () => {
    const html = templates.dailySummaryTemplate({
      dept: "CSE",
      date: "2026-07-09",
      frequencyLabel: "daily",
      mode: "threshold",
      threshold: 75,
      rows: [
        { semester: "3", subject: "DBMS", faculty: "Dr. X", period: "1", room: "R101", present: 10, totalStudents: 20, attendancePct: 50 },
        { semester: "5", subject: "OS", faculty: "Dr. Y", period: "2", room: "R102", present: 18, totalStudents: 20, attendancePct: 90 },
      ],
    });
    expect(html).toContain("Semester 3");
    expect(html).toContain("Semester 5");
    expect(html).toContain("75%");
  });

  it("embeddingProgressTemplate colors status and embeds semester groups", () => {
    const html = templates.embeddingProgressTemplate({
      dept: "CSE",
      semesterGroups: [
        { sem: "3", rows: [{ subject: "DBMS", faculty: "Dr. X", submitted: 20, groundTruthReady: 18, missing: 2, status: "Pending" }] },
      ],
    });
    expect(html).toContain("Semester 3");
    expect(html).toContain("Pending");
    expect(html).toContain("#d97706"); // Pending color
  });
});

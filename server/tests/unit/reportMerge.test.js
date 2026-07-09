const {
  mergeStudentStatus,
  buildSummary,
} = require("../../src/modules/attendanceModule/controllers/attendanceReportController");

function student(overrides = {}) {
  return {
    rollNo: "R1",
    status: "present",
    avgConfidence: 0.9,
    confidenceZone: "high",
    ...overrides,
  };
}

describe("mergeStudentStatus", () => {
  it("marks a student absent when every run says absent", () => {
    const slots = [
      { slot: 1, students: [student({ status: "absent", confidenceZone: "low" })] },
      { slot: 2, students: [student({ status: "absent", confidenceZone: "low" })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.finalStatus).toBe("A");
    expect(entry.autoFinalStatus).toBe("A");
  });

  it("marks present (high confidence) when present in at least one run", () => {
    const slots = [
      { slot: 1, students: [student({ status: "absent", confidenceZone: "low" })] },
      { slot: 2, students: [student({ status: "present", confidenceZone: "high", avgConfidence: 0.95 })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.finalStatus).toBe("P");
  });

  it("marks present (medium confidence) as P too", () => {
    const slots = [
      { slot: 1, students: [student({ status: "present", confidenceZone: "medium", avgConfidence: 0.6 })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.finalStatus).toBe("P");
  });

  it("marks review when the best present entry is low confidence", () => {
    const slots = [
      { slot: 1, students: [student({ status: "present", confidenceZone: "low", avgConfidence: 0.3 })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.finalStatus).toBe("R");
  });

  it("marks review when there are only review entries (no present)", () => {
    const slots = [
      { slot: 1, students: [student({ status: "review", confidenceZone: "low" })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.finalStatus).toBe("R");
  });

  it("picks the highest-confidence entry across camera slots for reported fields", () => {
    const slots = [
      { slot: 1, students: [student({ status: "present", avgConfidence: 0.4, clusterFolder: "low_conf" })] },
      { slot: 2, students: [student({ status: "present", avgConfidence: 0.95, clusterFolder: "high_conf" })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.avgConfidence).toBe(0.95);
    expect(entry.clusterFolder).toBe("high_conf");
  });

  it("surfaces genderMismatch true if ANY slot flagged it", () => {
    const slots = [
      { slot: 1, students: [student({ status: "present", genderMismatch: false })] },
      { slot: 2, students: [student({ status: "present", genderMismatch: true, avgConfidence: 0.1 })] },
    ];
    const [entry] = mergeStudentStatus(slots);
    expect(entry.genderMismatch).toBe(true);
  });
});

describe("buildSummary", () => {
  it("counts P/A/R and computes rounded attendance percentage", () => {
    const finalReport = [
      { finalStatus: "P" },
      { finalStatus: "P" },
      { finalStatus: "A" },
      { finalStatus: "R" },
    ];
    const summary = buildSummary(finalReport);
    expect(summary).toEqual({
      totalStudents: 4,
      present: 2,
      absent: 1,
      review: 1,
      attendancePct: 50,
    });
  });

  it("returns attendancePct 0 for an empty report", () => {
    expect(buildSummary([])).toEqual({
      totalStudents: 0,
      present: 0,
      absent: 0,
      review: 0,
      attendancePct: 0,
    });
  });
});

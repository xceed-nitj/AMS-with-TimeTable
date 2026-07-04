// embeddingProgressScheduler.js
// Weekly email to head/coordinator recipients (via the existing
// NotificationSettings roles/recipients system) summarizing embedding /
// ground-truth readiness per subject, grouped by department with one table
// per semester. Follows the same "register once at startup, fixed cron time"
// shape as hodSummaryScheduler.js / frameCleanupScheduler.js.

const cron = require("node-cron");
const Subject = require("../../../models/subject");
const StudentEmbedding = require("../../../models/attendanceModule/studentEmbedding");
const MasterClassTable = require("../../../models/masterclasstable");
const NotificationSettings = require("../../../models/attendanceModule/notificationSettings");
const alertNotifier = require("./alertNotifier");

const normalizeSubjectKey = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toUpperCase();

// Best-effort, display-only lookup — faculty name is shown in the table but
// never used to decide who receives the email (that's role/recipient based).
async function resolveFacultyName(subject) {
  const sem = String(subject.sem || "").trim();
  const or = [];
  if (subject.subCode) or.push({ subjectCode: subject.subCode });
  if (subject.subName) or.push({ subject: subject.subName });
  if (or.length === 0) return null;

  const query = { sem, $or: or };
  if (subject.dept) {
    query.$and = [{ $or: [{ subjectDept: subject.dept }, { offeringDept: subject.dept }] }];
  }
  const match = await MasterClassTable.findOne(query).lean();
  return match?.faculty || null;
}

function findMatchingEmbedding(subject, embeddingsForSem) {
  const aliases = [subject.subCode, subject.subName, subject.subjectFullName]
    .map(normalizeSubjectKey)
    .filter(Boolean);
  return embeddingsForSem.find((e) => {
    const embAliases = [e.subjectCode, e.subject].map(normalizeSubjectKey).filter(Boolean);
    return embAliases.some((a) => aliases.includes(a));
  });
}

function determineStatus(match) {
  if (!match || !match.rollNos || match.rollNos.length === 0) return "Not Started";
  if (match.status === "done") return "Completed";
  return "Pending"; // pending or failed — still needs action
}

async function runEmbeddingProgressCheck() {
  const settings = await NotificationSettings.getSettings();
  if (!settings.enabled) return;

  const depts = await Subject.distinct("dept", { dept: { $nin: [null, ""] } });

  for (const dept of depts) {
    try {
      const subjects = await Subject.find({ dept }).lean();
      if (subjects.length === 0) continue;

      const embeddings = await StudentEmbedding.find({ dept }).sort({ generatedAt: -1 }).lean();
      const bySemEmbeddings = {};
      for (const e of embeddings) {
        const sem = String(e.sem || "").trim();
        if (!bySemEmbeddings[sem]) bySemEmbeddings[sem] = [];
        bySemEmbeddings[sem].push(e);
      }

      const bySem = {};
      for (const subject of subjects) {
        const sem = String(subject.sem || "").trim();
        if (!sem) continue;

        const match = findMatchingEmbedding(subject, bySemEmbeddings[sem] || []);
        const faculty = await resolveFacultyName(subject);

        if (!bySem[sem]) bySem[sem] = [];
        bySem[sem].push({
          subject: subject.subName || subject.subjectFullName || subject.subCode || "Unknown",
          faculty,
          submitted: match ? (match.studentsTotal ?? match.rollNos?.length ?? null) : null,
          groundTruthReady: match ? (match.studentsSuccess ?? null) : null,
          missing: match ? (match.studentsFailed ?? null) : null,
          status: determineStatus(match),
        });
      }

      const semesterGroups = Object.keys(bySem)
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
        .map((sem) => ({ sem, rows: bySem[sem] }));

      if (semesterGroups.length === 0) continue;

      await alertNotifier.notifyEmbeddingProgress({ dept, semesterGroups });
    } catch (err) {
      console.error("[EmbeddingProgressScheduler] Failed for dept", dept, ":", err.message);
    }
  }
}

/**
 * Register the weekly cron job (call once at server startup).
 * Runs Friday 18:00 — same slot as the HOD weekly attendance summary.
 */
function startEmbeddingProgressScheduler() {
  cron.schedule("0 18 * * 5", () => {
    runEmbeddingProgressCheck().catch((err) =>
      console.error("[EmbeddingProgressScheduler] Unhandled error:", err.message),
    );
  });
  console.log("[EmbeddingProgressScheduler] Scheduler registered — runs weekly Fri 18:00");
}

module.exports = { startEmbeddingProgressScheduler, runEmbeddingProgressCheck };

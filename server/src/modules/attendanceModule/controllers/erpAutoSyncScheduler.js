// erpAutoSyncScheduler.js
// Nightly: re-fetches every subject's roster from the ERP and regenerates
// embeddings ONLY for subjects whose roster actually changed since the last
// sync (see erpSyncController.js's syncSubjectRolls -> rollsChanged, a
// Set-based diff against the previously stored Subject.enrolledRollNos).
// Unchanged subjects are skipped entirely — no ML load for no benefit.
//
// Follows the same "register once at startup, fixed cron time" shape as
// hodSummaryScheduler.js / embeddingProgressScheduler.js, and reuses the
// exact per-subject sync logic the ERP Sync page's own Fetch/Generate
// buttons use (nothing duplicated here).

const cron = require("node-cron");
const Subject = require("../../../models/subject");
const ErpSyncSettings = require("../../../models/attendanceModule/erpSyncSettings");
const {
  syncSubjectRolls,
  getFirstYearCodes,
  resolveFirstYearTeachingDepts,
  firstYearStudentSem,
  erpConfigured,
} = require("./erpSyncController");
const { runGenerateHeadless } = require("./embeddingController");

async function resolveGenerateParams(subject, isFirstYear) {
  if (!isFirstYear) {
    return { sem: subject.sem, dept: subject.dept || "UNKNOWN" };
  }
  // First-year subjects carry a section string in `sem`, not a real semester
  // number, and no owning department — resolve both the same way the ERP
  // Sync page's "First Year" group does.
  let dept = "UNKNOWN";
  try {
    const teachingDepts = await resolveFirstYearTeachingDepts(subject);
    if (teachingDepts.size > 0) dept = [...teachingDepts][0];
  } catch (err) {
    console.warn(`[ErpAutoSync] Teaching-dept lookup failed for ${subject.subjectFullName}: ${err.message}`);
  }
  return { sem: String(firstYearStudentSem()), dept };
}

async function runErpAutoSync() {
  if (!erpConfigured()) {
    console.log("[ErpAutoSync] ERP_API_URL not configured — skipping run.");
    return;
  }
  const settings = await ErpSyncSettings.getSettings();
  if (!settings.enabled) {
    console.log("[ErpAutoSync] Disabled via ERP Sync page toggle — skipping run.");
    return;
  }

  const subjects = await Subject.find({}).lean();
  const firstYearCodes = await getFirstYearCodes();

  let checked = 0, regenerated = 0, unchanged = 0, failed = 0;

  // Sequential — kind to both the ERP server and the ML machine (matches
  // fetchRollsBulk's existing sequential loop). This is a background job, not
  // a request a user is waiting on, so taking a while is fine.
  for (const subject of subjects) {
    checked += 1;
    const isFirstYear = firstYearCodes.has(subject.code);

    try {
      const result = await syncSubjectRolls(subject, false, isFirstYear);

      if (!result.ok) {
        failed += 1;
        console.log(`[ErpAutoSync] ${subject.subjectFullName}: ERP fetch failed (${result.error})`);
        continue;
      }

      if (!result.rollsChanged) {
        unchanged += 1;
        continue;
      }

      const { sem, dept } = await resolveGenerateParams(subject, isFirstYear);
      const genResult = await runGenerateHeadless({
        sem,
        subject: subject.subjectFullName,
        dept,
        subjectCode: subject.subCode || "",
        rollNos: result.rollNos,
        instituteWise: isFirstYear,
        subjectId: subject._id,
        rosterExact: true,
      });

      if (genResult.ok) {
        regenerated += 1;
        console.log(`[ErpAutoSync] ${subject.subjectFullName}: roster changed — regenerated `
          + `(${genResult.summary?.success ?? "?"} ok, ${genResult.summary?.failed ?? "?"} failed)`);
      } else {
        failed += 1;
        console.log(`[ErpAutoSync] ${subject.subjectFullName}: roster changed but generation failed`);
      }
    } catch (err) {
      failed += 1;
      console.error(`[ErpAutoSync] ${subject.subjectFullName}: unexpected error — ${err.message}`);
    }
  }

  console.log(`[ErpAutoSync] Run complete — checked=${checked} regenerated=${regenerated} `
    + `unchanged=${unchanged} failed=${failed}`);

  settings.lastRunAt = new Date();
  settings.lastRunStats = { checked, regenerated, unchanged, failed };
  await settings.save();
}

/**
 * Register the nightly cron job (call once at server startup).
 * Runs 02:00 — off-peak, avoids competing with daytime attendance runs on
 * the same ML machine.
 */
function startErpAutoSyncScheduler() {
  cron.schedule("0 2 * * *", () => {
    runErpAutoSync().catch((err) =>
      console.error("[ErpAutoSync] Unhandled error:", err.message),
    );
  });
  console.log("[ErpAutoSync] Scheduler registered — runs nightly 02:00");
}

module.exports = { startErpAutoSyncScheduler, runErpAutoSync };

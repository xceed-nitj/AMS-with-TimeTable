// server/src/modules/attendanceModule/controllers/erpSyncController.js
//
// ERP roster sync — fetches each subject's enrolled roll numbers from the
// external ERP server over HTTP and persists them on the Subject document
// (enrolledRollNos / missedGroundTruth / embeddingUpdatedAt), making Subject
// the roster source of truth for the ERP Sync page. Embedding generation
// itself is NOT here — the page reuses POST /attendancemodule/embeddings/
// generate with the fetched roster (see embeddingController.js).
//
// ── Configuration (env) ──────────────────────────────────────────────────────
//   ERP_API_URL    required — base URL of the ERP server, e.g. https://erp.example.edu/api
//   ERP_API_KEY    optional — sent as both `Authorization: Bearer <key>` and `x-api-key`
//   ERP_ROLLS_PATH optional — path template appended to ERP_API_URL. Default:
//                  /rollnos/{key}
//                  Placeholders: {key} {subCode} {sem} {dept} {subjectName}
//                  {key} is the ERP's subject key: semester + subject
//                  abbreviation concatenated (e.g. sem "6" + subName "DE"
//                  → "6DE"), spaces stripped, uppercased.
//
// ── Expected ERP response (parsed defensively) ──────────────────────────────
//   { rollNos: ["21CS001", ...], faculty: "Dr. X" } | { data: [...] } | [...]
//   or arrays of objects carrying a rollNo / roll_no / rollno / regno field.
//   Faculty name keys tried: faculty / facultyName / faculty_name / teacher /
//   instructor (top level). The ERP faculty is matched against the timetable
//   module's faculty for the same sem+abbreviation (LockSem slotData).

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const Subject = require('../../../models/subject');
const LockSem = require('../../../models/locksem');
const TimeTable = require('../../../models/timetable');
const ErpSyncSettings = require('../../../models/attendanceModule/erpSyncSettings');

// First-year subjects live under the "Basic Sciences" timetable (no real
// owning department exists) and are mapped to the teaching faculty's
// department via the Map First Year Subjects page (Subject.dept). They're
// identified by Subject.code matching a Basic Sciences timetable's code —
// same mechanism firstYearSubjectMappingController uses. For these subjects
// institute-wide ground-truth search is applied AUTOMATICALLY: their
// students' GT folders live under first-year/other-branch batch folders,
// never under the teaching department's.
const BASIC_SCIENCES_DEPT = 'Basic Sciences';

async function getFirstYearCodes() {
    try {
        let tts = await TimeTable.find({ dept: BASIC_SCIENCES_DEPT, currentSession: true })
            .select('code').lean();
        if (!tts.length) {
            // Fallback: current academic session by date (Aug–Jul), same
            // convention the schedulers use.
            const now = new Date();
            const start = (now.getMonth() + 1) >= 8 ? now.getFullYear() : now.getFullYear() - 1;
            const session = `${start}-${String(start + 1).slice(2)}`;
            tts = await TimeTable.find({ dept: BASIC_SCIENCES_DEPT, session })
                .select('code').lean();
        }
        return new Set(tts.map((t) => t.code).filter(Boolean));
    } catch (err) {
        console.warn(`[ErpSync] First-year timetable lookup failed: ${err.message}`);
        return new Set();
    }
}

const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

const ERP_API_URL    = process.env.ERP_API_URL || '';
const ERP_API_KEY    = process.env.ERP_API_KEY || '';
const ERP_ROLLS_PATH = process.env.ERP_ROLLS_PATH || '/rollnos/{key}';

function erpConfigured() {
    return !!ERP_API_URL.trim();
}

// Which student semester (1 or 2) first-year subjects are running in right
// now — Aug–Dec = odd (1), Jan–Jul = even (2). Same odd/even-session
// convention the Map First Year Subjects page uses; first-year Subject.sem
// itself holds a SECTION string (e.g. "B.Tech-CH+VLSI-SectionB6"), not a
// semester number.
function firstYearStudentSem() {
    return (new Date().getMonth() + 1) >= 8 ? 1 : 2;
}

// The ERP's subject key: semester + subject abbreviation concatenated
// (e.g. sem "6" + subName "DE" → "6DE"), spaces stripped, uppercased.
// First-year subjects use the derived student semester (1/2) instead of
// their section-string sem field.
function erpSubjectKey(subject, isFirstYear = false) {
    const sem = isFirstYear ? String(firstYearStudentSem()) : String(subject.sem || '').trim();
    const abbrev = String(subject.subName || subject.subCode || '')
        .replace(/\s+/g, '').toUpperCase();
    return `${sem}${abbrev}`;
}

function buildErpUrl(subject, isFirstYear = false) {
    const semForKey = isFirstYear ? String(firstYearStudentSem()) : String(subject.sem || '');
    const fill = (tpl) => tpl
        .replace('{key}',         encodeURIComponent(erpSubjectKey(subject, isFirstYear)))
        .replace('{subCode}',     encodeURIComponent(subject.subCode || ''))
        .replace('{sem}',         encodeURIComponent(semForKey))
        .replace('{dept}',        encodeURIComponent(subject.dept || ''))
        .replace('{subjectName}', encodeURIComponent(subject.subjectFullName || subject.subName || ''));
    return ERP_API_URL.replace(/\/$/, '') + fill(ERP_ROLLS_PATH);
}

// Accepts every response shape listed in the header comment; returns
// { rollNos, faculty } — rollNos normalized (trimmed, uppercased, deduped),
// faculty the ERP-reported faculty name (or null).
function parseErpResponse(payload) {
    let faculty = null;
    let list = payload;
    if (list && typeof list === 'object' && !Array.isArray(list)) {
        faculty = list.faculty ?? list.facultyName ?? list.faculty_name
               ?? list.teacher ?? list.instructor ?? null;
        list = list.rollNos || list.roll_nos || list.data || list.students || [];
    }
    if (!Array.isArray(list)) list = [];

    const rolls = [];
    for (const item of list) {
        let value = item;
        if (item && typeof item === 'object') {
            value = item.rollNo ?? item.roll_no ?? item.rollno ?? item.regno ?? '';
        }
        const roll = String(value ?? '').trim().toUpperCase();
        if (roll.length > 3) rolls.push(roll);
    }
    return {
        rollNos: [...new Set(rolls)],
        faculty: faculty ? String(faculty).trim() : null,
    };
}

async function fetchRollsFromErp(subject, isFirstYear = false) {
    const url = buildErpUrl(subject, isFirstYear);
    const headers = {};
    if (ERP_API_KEY) {
        headers['Authorization'] = `Bearer ${ERP_API_KEY}`;
        headers['x-api-key']     = ERP_API_KEY;
    }
    const res = await axios.get(url, { headers, timeout: 15000 });
    return parseErpResponse(res.data);
}

// ── Timetable faculty lookup (sem + abbreviation) ────────────────────────────
// Finds the faculty the timetable module (LockSem, current session) records
// for this subject: matches slotData.subject against the subject's
// abbreviation (subName) or full name, on LockSem docs whose sem contains the
// same semester number. Prefers entries from this department's timetable;
// multiple distinct names are joined with ", ".
async function lookupTimetableFaculty(subject, semOverride = null) {
    const semNum = semOverride != null
        ? String(semOverride)
        : (String(subject.sem || '').match(/\d+/)?.[0] || String(subject.sem || ''));
    const escape = (v) => String(v).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePatterns = [subject.subName, subject.subjectFullName]
        .filter(Boolean)
        .map((s) => new RegExp(`^\\s*${escape(s)}\\s*$`, 'i'));
    if (!namePatterns.length || !semNum) return null;

    const records = await LockSem.aggregate([
        { $match: { sem: { $regex: new RegExp(escape(semNum)) } } },
        { $lookup: { from: 'timetables', localField: 'timetable', foreignField: '_id', as: 'tt' } },
        { $unwind: '$tt' },
        { $match: { 'tt.currentSession': true } },
        { $unwind: '$slotData' },
        { $match: { $or: namePatterns.map((re) => ({ 'slotData.subject': re })) } },
        { $project: { faculty: '$slotData.faculty', dept: '$tt.dept' } },
    ]);
    if (!records.length) return null;

    const norm = (v) => String(v || '').toUpperCase().replace(/[\s_]+/g, '');
    const deptMatching = records.filter((r) => norm(r.dept) === norm(subject.dept));
    const pool = deptMatching.length ? deptMatching : records;
    const names = [...new Set(pool.map((r) => String(r.faculty || '').trim()).filter(Boolean))];
    return names.length ? names.join(', ') : null;
}

// For a first-year subject, resolve the department(s) of the faculty
// actually teaching it: timetable faculty names (LockSem, first-year sem)
// → Faculty collection's dept field. No "Basic Sciences" department exists,
// so first-year subjects belong, for listing purposes, to whichever
// department their teacher comes from.
const Faculty = require('../../../models/faculty');

async function resolveFirstYearTeachingDepts(subject) {
    const depts = new Set();
    try {
        const facultyJoined = await lookupTimetableFaculty(subject, firstYearStudentSem());
        if (!facultyJoined) return depts;
        for (const name of facultyJoined.split(',').map((n) => n.trim()).filter(Boolean)) {
            const fac = await Faculty.findOne({ name: new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') })
                .select('dept').lean();
            if (fac?.dept) depts.add(String(fac.dept));
        }
    } catch (err) {
        console.warn(`[ErpSync] First-year teaching-dept lookup failed for ${subject.subjectFullName}: ${err.message}`);
    }
    return depts;
}

// Case/space/honorific-insensitive comparison — the timetable side may hold
// several names (joined with ", "), so a match on any one counts.
function facultyNamesMatch(erpFaculty, timetableFaculty) {
    if (!erpFaculty || !timetableFaculty) return null;
    const clean = (v) => String(v)
        .toLowerCase()
        .replace(/\b(dr|prof|professor|mr|mrs|ms)\b\.?/g, '')
        .replace(/[^a-z]/g, '');
    const erp = clean(erpFaculty);
    if (!erp) return null;
    return timetableFaculty.split(',').some((name) => {
        const tt = clean(name);
        return tt && (tt === erp || tt.includes(erp) || erp.includes(tt));
    });
}

// Set-based symmetric-difference comparison (same idiom as
// erpEmbeddingSyncHelper.js's getErpStatus) — NOT array/string equality,
// since syncSubjectRolls doesn't sort before persisting and the ERP is free
// to return the same roster in a different order on every call. Used by
// erpAutoSyncScheduler.js to decide whether a subject's roster actually
// changed since the last sync, so it only regenerates embeddings for
// subjects that need it instead of every subject on every run.
function rollSetsEqual(a, b) {
    const setA = new Set((a || []).map((r) => String(r).trim().toUpperCase()));
    const setB = new Set((b || []).map((r) => String(r).trim().toUpperCase()));
    if (setA.size !== setB.size) return false;
    for (const roll of setA) {
        if (!setB.has(roll)) return false;
    }
    return true;
}

// Same scan the xlsx upload flow uses (embeddingController.uploadRollNosXlsx):
// a roll is "missed" when no ground_truth/{batch}/{roll} folder exists —
// across all batch folders when instituteWise, else dept-matching ones only.
function computeMissedGroundTruth(rollNos, dept, instituteWise) {
    if (!fs.existsSync(GROUND_TRUTH_DIR)) return [...rollNos];
    const allBatches = fs.readdirSync(GROUND_TRUTH_DIR);
    const batches = instituteWise
        ? allBatches
        : allBatches.filter(b => b.toUpperCase().includes((dept || '').toUpperCase()));
    const missed = [];
    for (const rollNo of rollNos) {
        const found = batches.some(batch =>
            fs.existsSync(path.join(GROUND_TRUTH_DIR, batch, rollNo)));
        if (!found) missed.push(rollNo);
    }
    return missed;
}

async function syncSubjectRolls(subject, instituteWise, isFirstYear = false) {
    const previousRollNos = subject.enrolledRollNos || [];
    const { rollNos, faculty: erpFaculty } = await fetchRollsFromErp(subject, isFirstYear);
    if (rollNos.length === 0) {
        return { subjectId: subject._id, subject: subject.subjectFullName,
                 ok: false, error: 'ERP returned no roll numbers' };
    }
    // Roster diff — used by erpAutoSyncScheduler.js to skip embedding
    // regeneration entirely when nothing actually changed since last sync.
    const rollsChanged = !rollSetsEqual(previousRollNos, rollNos);

    // First-year subjects always scan institute-wide — their students' GT
    // folders never live under the teaching department's batch folders.
    const effectiveInstituteWise = instituteWise || isFirstYear;
    const missedGroundTruth = computeMissedGroundTruth(rollNos, subject.dept, effectiveInstituteWise);

    // Faculty cross-check against the timetable module (sem + abbreviation);
    // first-year subjects match on the derived student semester (1/2), since
    // their sem field holds a section string.
    let timetableFaculty = null;
    try {
        timetableFaculty = await lookupTimetableFaculty(
            subject, isFirstYear ? firstYearStudentSem() : null);
    } catch (err) {
        console.warn(`[ErpSync] Timetable faculty lookup failed for ${subject.subjectFullName}: ${err.message}`);
    }
    const facultyMatch = facultyNamesMatch(erpFaculty, timetableFaculty);

    await Subject.findByIdAndUpdate(subject._id, {
        enrolledRollNos:    rollNos,
        missedGroundTruth,
        erpSyncedAt:        new Date(),
        erpFaculty,
        timetableFaculty,
        facultyMatch,
    });
    return {
        subjectId: subject._id,
        subject:   subject.subjectFullName,
        ok:        true,
        rollsChanged,
        rollNos,
        total:     rollNos.length,
        missedCount: missedGroundTruth.length,
        missedGroundTruth,
        erpFaculty,
        timetableFaculty,
        facultyMatch,
    };
}

// ── Route handlers ───────────────────────────────────────────────────────────

// Collect the subjects the ERP tab shows for a department:
//   • regular subjects whose Subject.dept matches (optionally sem-filtered)
//   • PLUS first-year (Basic Sciences timetable) subjects taught by this
//     department's faculty — they carry no owning dept, so the link comes
//     from the timetable faculty's Faculty.dept, mirroring the timetable
//     module's first-year allotment. Marked with __isFirstYear.
// First-year subjects are included when no sem filter is set, or when the
// filter equals the current first-year student semester (1/2).
// Sentinel the frontend's Semester dropdown sends for its explicit
// "First Year" entry — first-year subjects have no real semester number
// (their Subject.sem holds a section string like "B.Tech-CH+VLSI-SectionB6"),
// so they can't be reached via the normal numeric dropdown at all.
const FIRST_YEAR_SENTINEL = 'FIRST_YEAR';

async function collectSubjectsForDept(dept, sem) {
    const normDept = (v) => String(v || '').toUpperCase().replace(/[\s_]+/g, '');
    const firstYearOnly = sem === FIRST_YEAR_SENTINEL;
    const firstYearCodes = await getFirstYearCodes();

    // ── Explicit "First Year" selection — ONLY first-year subjects taught
    // by this department's faculty, regardless of the derived student sem.
    if (firstYearOnly) {
        if (firstYearCodes.size === 0) return [];
        const fyCandidates = await Subject.find({ code: { $in: [...firstYearCodes] } }).lean();
        const subjects = [];
        for (const fy of fyCandidates) {
            const teachingDepts = await resolveFirstYearTeachingDepts(fy);
            if ([...teachingDepts].some((d) => normDept(d) === normDept(dept))) {
                subjects.push({ ...fy, __isFirstYear: true });
            }
        }
        subjects.sort((a, b) => String(a.subjectFullName).localeCompare(String(b.subjectFullName)));
        return subjects;
    }

    const filter = {
        dept: { $regex: new RegExp(String(dept).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    };
    if (sem) filter.sem = String(sem);

    const subjects = (await Subject.find(filter).lean())
        .map((s) => ({ ...s, __isFirstYear: false }));

    const includeFY = firstYearCodes.size > 0 && !sem;
    if (includeFY) {
        const seen = new Set(subjects.map((s) => String(s._id)));
        const fyCandidates = await Subject.find({ code: { $in: [...firstYearCodes] } }).lean();
        for (const fy of fyCandidates) {
            if (seen.has(String(fy._id))) {
                const existing = subjects.find((s) => String(s._id) === String(fy._id));
                if (existing) existing.__isFirstYear = true;
                continue;
            }
            const teachingDepts = await resolveFirstYearTeachingDepts(fy);
            if ([...teachingDepts].some((d) => normDept(d) === normDept(dept))) {
                subjects.push({ ...fy, __isFirstYear: true });
            }
        }
    } else {
        // Still mark dept-matched subjects that happen to be first-year.
        for (const s of subjects) {
            if (firstYearCodes.has(s.code)) s.__isFirstYear = true;
        }
    }
    subjects.sort((a, b) => {
        // First Year group leads, then numeric semesters ascending.
        const keyOf = (s) => s.__isFirstYear
            ? -1
            : parseInt(String(s.sem).match(/\d+/)?.[0] || '99', 10);
        const ka = keyOf(a), kb = keyOf(b);
        if (ka !== kb) return ka - kb;
        return String(a.subjectFullName).localeCompare(String(b.subjectFullName));
    });
    return subjects;
}

// GET /erp-sync/subjects?dept=&sem=
// sem optional — omitted returns ALL semesters for the department, sorted
// sem-wise (the ERP tab renders them grouped by semester, First Year first).
async function listSubjects(req, res) {
    try {
        const { dept, sem } = req.query;
        if (!dept) return res.status(400).json({ error: 'dept is required' });

        const subjects = await collectSubjectsForDept(dept, sem);
        const fySem = firstYearStudentSem();

        res.json({
            erpConfigured: erpConfigured(),
            subjects: subjects.map(s => ({
                _id:              s._id,
                isFirstYear:      !!s.__isFirstYear,
                studentSem:       s.__isFirstYear ? fySem : null,
                groupLabel:       s.__isFirstYear ? 'First Year' : `Semester ${s.sem}`,
                subjectFullName:  s.subjectFullName,
                subName:          s.subName,
                subCode:          s.subCode,
                type:             s.type,
                sem:              s.sem,
                dept:             s.dept,
                erpKey:           erpSubjectKey(s, !!s.__isFirstYear),
                rollCount:        (s.enrolledRollNos || []).length,
                missedCount:      (s.missedGroundTruth || []).length,
                missedGroundTruth: s.missedGroundTruth || [],
                enrolledRollNos:  s.enrolledRollNos || [],
                embeddingFile:    s.embeddingFile || null,
                embeddingUpdatedAt: s.embeddingUpdatedAt || null,
                erpSyncedAt:      s.erpSyncedAt || null,
                erpFaculty:       s.erpFaculty || null,
                timetableFaculty: s.timetableFaculty || null,
                facultyMatch:     s.facultyMatch ?? null,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /erp-sync/fetch-rolls  { subjectId, instituteWise }
async function fetchRolls(req, res) {
    try {
        if (!erpConfigured()) {
            return res.status(503).json({ error: 'ERP_API_URL not configured on the server.' });
        }
        const { subjectId, instituteWise } = req.body;
        if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

        const subject = await Subject.findById(subjectId).lean();
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const firstYearCodes = await getFirstYearCodes();
        const isFirstYear = firstYearCodes.has(subject.code);
        const result = await syncSubjectRolls(subject, !!instituteWise, isFirstYear);
        res.json(result);
    } catch (err) {
        const status = err.response?.status;
        res.status(502).json({
            error: `ERP fetch failed${status ? ` (HTTP ${status})` : ''}: ${err.message}`,
        });
    }
}

// POST /erp-sync/fetch-rolls-bulk  { dept, sem?, instituteWise }
// sem optional — omitted syncs every semester's subjects for the department.
// Sequential on purpose — kinder to the ERP server than a parallel burst.
async function fetchRollsBulk(req, res) {
    try {
        if (!erpConfigured()) {
            return res.status(503).json({ error: 'ERP_API_URL not configured on the server.' });
        }
        const { dept, sem, instituteWise } = req.body;
        if (!dept) return res.status(400).json({ error: 'dept is required' });

        // Same subject set the tab lists — dept-owned subjects plus
        // first-year subjects taught by this department's faculty.
        const subjects = await collectSubjectsForDept(dept, sem);

        const results = [];
        for (const subject of subjects) {
            try {
                results.push(await syncSubjectRolls(subject, !!instituteWise, !!subject.__isFirstYear));
            } catch (err) {
                results.push({
                    subjectId: subject._id,
                    subject:   subject.subjectFullName,
                    ok:        false,
                    error:     err.response?.status ? `HTTP ${err.response.status}` : err.message,
                });
            }
        }
        res.json({ total: subjects.length, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// GET /erp-sync/settings — on/off state of the nightly auto-sync scheduler
// (erpAutoSyncScheduler.js). Independent of ERP_API_URL being configured —
// the toggle can be flipped either way regardless of reachability.
async function getSettings(req, res) {
    try {
        const settings = await ErpSyncSettings.getSettings();
        res.json({
            enabled: settings.enabled,
            lastRunAt: settings.lastRunAt,
            lastRunStats: settings.lastRunStats,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// PATCH /erp-sync/settings  { enabled }
async function updateSettings(req, res) {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled (boolean) is required' });
        }
        const settings = await ErpSyncSettings.getSettings();
        settings.enabled = enabled;
        await settings.save();
        res.json({ enabled: settings.enabled });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    listSubjects, fetchRolls, fetchRollsBulk, FIRST_YEAR_SENTINEL,
    getSettings, updateSettings,
    // Exported for erpAutoSyncScheduler.js — the nightly change-detected sync
    // reuses the exact same per-subject logic the manual Fetch/Generate
    // buttons use, rather than duplicating it.
    syncSubjectRolls, getFirstYearCodes, resolveFirstYearTeachingDepts,
    firstYearStudentSem, rollSetsEqual, erpConfigured,
    // Exported for healthRoutes.js — the header health bar's ERP reachability
    // check hits this same base URL directly (no dedicated ERP health route
    // is assumed to exist on the ERP server).
    ERP_API_URL,
};

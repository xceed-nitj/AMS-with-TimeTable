// server/src/modules/attendanceModule/controllers/groundTruthController.js

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const axios      = require('axios');

const LockSem  = require('../../../models/locksem');
const TimeTable = require('../../../models/timetable');
const AddSem    = require('../../../models/addsem');
const {
    updateStudentEmbedding: syncUpdateStudentEmbedding,
    buildBatchEmbeddingsPkl,
} = require('./embeddingSyncHelper');

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');
const EMBEDDINGS_DIR   = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings');


function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}
ensureDir(GROUND_TRUTH_DIR);
ensureDir(EMBEDDINGS_DIR);

function findFileInDir(dir, filename) {
    if (!fs.existsSync(dir)) return null;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const found = findFileInDir(full, filename);
            if (found) return found;
        } else if (entry.name === filename) {
            return full;
        }
    }
    return null;
}

// ← ADD HERE
async function rebuildSubjectPklsForStudent(rollNo, batch) {
    const StudentEmbedding = require('../../../models/attendanceModule/studentEmbedding');
    const subjectRecords = await StudentEmbedding.find({
        rollNos: rollNo,
        status: 'done',
    }).lean();

    console.log(`[rebuildSubjectPkls] ${rollNo} → ${subjectRecords.length} subject PKL(s) to rebuild`);

    // Deduplicate: group records by their resolved pklPath so the same file is only rebuilt once
const pklGroups = new Map(); // pklPath → { record, rollNos: Set }
for (const record of subjectRecords) {
    const pklPath = findFileInDir(EMBEDDINGS_DIR, record.embeddingFile);
    if (!pklPath) {
        console.warn(`[rebuildSubjectPkls] PKL not found on disk: ${record.embeddingFile}`);
        continue;
    }
    if (!pklGroups.has(pklPath)) {
        pklGroups.set(pklPath, { record, rollNos: new Set(record.rollNos) });
    } else {
        // merge rollNos from duplicate records pointing to the same file
        for (const r of record.rollNos) pklGroups.get(pklPath).rollNos.add(r);
    }
}

const batchDir = path.join(GROUND_TRUTH_DIR, batch);
if (!fs.existsSync(batchDir)) return;

for (const [pklPath, { record }] of pklGroups) {
    try {
        console.log(`[rebuildSubjectPkls] Rebuilding ${record.embeddingFile} …`);
        await buildBatchEmbeddingsPkl(batchDir, pklPath);
        await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {}, { timeout: 30000 });
        console.log(`[rebuildSubjectPkls] ✓ Done ${record.embeddingFile}`);
    } catch (err) {
        console.warn(`[rebuildSubjectPkls] Failed ${record.embeddingFile}:`, err.message);
    }
}
}


function mlError(err) {
    if (err.code === 'ECONNREFUSED')
        return `Python ML service is not running at ${ML_SERVICE_URL}. Start it with: python ml_service.py`;
    return err.response?.data?.detail || err.message || 'Unknown ML service error';
}

// ─── Normalise any string for folder-name comparison ─────────────────────────
// "CIVIL ENGINEERING" → "CIVIL_ENGINEERING"  (spaces/dashes → underscores, UPPER)
function normKey(s) {
    return (s || '').trim().replace(/[\s\-]+/g, '_').toUpperCase();
}

// ─── Normalise a room number for matching ─────────────────────────────────────
// Strips spaces, hyphens, dots and lowercases so:
// "LT-203" == "lt203" == "LT 203" == "lt-203"
function normRoom(r) {
    return (r || '').trim().replace(/[\s\-\.]+/g, '').toLowerCase();
}

// ─── Derive admission year from sem + session ─────────────────────────────────
// Handles multiple sem formats:
//   "6"           → 6
//   "B.Tech-CE-4" → 4  (extract last number)
//   "4th"         → 4
//   "Sem-3"       → 3
// Handles multiple session formats:
//   "2024-25-ODD"      → 2024
//   "2025-2026 (Even)" → 2025  (first 4-digit year)
//   "2025-26"          → 2025
function deriveAdmissionYear(sem, session) {
    // Extract the LAST number from sem string
    // "B.Tech-CE-4" → ["4"] → 4
    // "6" → ["6"] → 6
    const semMatches = (sem || '').match(/\d+/g);
    const semNum     = semMatches ? parseInt(semMatches[semMatches.length - 1]) : 0;

    // Extract the FIRST 4-digit year from session string
    const sessionYear = parseInt((session || '').match(/\d{4}/)?.[0] || '0');

    console.log(`[deriveAdmissionYear] sem="${sem}" → semNum=${semNum}, session="${session}" → sessionYear=${sessionYear}`);

    if (!sessionYear || !semNum) return null;
    return String(sessionYear - Math.ceil(semNum / 2) + 1);
}

// ─── Find matching ground_truth folder ────────────────────────────────────────
// Scans GROUND_TRUTH_DIR and normalises folder names before comparing so that
// "BTECH_CIVIL ENGINEERING_2024" == "BTECH_CIVIL_ENGINEERING_2024"
// Returns the ACTUAL folder name (may still contain spaces).
function findGroundTruthFolder(degree, dept, admissionYear) {
    if (!degree || !dept || !admissionYear) return null;
    const targetKey = `${normKey(degree)}_${normKey(dept)}_${normKey(admissionYear)}`;
    try {
        for (const name of fs.readdirSync(GROUND_TRUTH_DIR)) {
            if (normKey(name) === targetKey) return name;
        }
    } catch (_) {}
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
class GroundTruthController {

    // ─── List all batch folders ──────────────────────────────────────────────
    async listBatches(req, res) {
        try {
            const entries = await fsPromises.readdir(GROUND_TRUTH_DIR, { withFileTypes: true });
            const batches = [];
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                if (
                    !req.attendanceFullAccess
                    && !req.attendanceDepartment
                ) continue;
                if (
                    !req.attendanceFullAccess
                    && !new RegExp(
                        `^[^_]+_${req.attendanceDepartment.trim().replace(/[\s-]+/g, '_').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_`,
                        'i',
                    ).test(entry.name)
                ) continue;
                const batchPath = path.join(GROUND_TRUTH_DIR, entry.name);
                const students  = await fsPromises.readdir(batchPath, { withFileTypes: true });
                batches.push({ batch: entry.name, studentCount: students.filter(s => s.isDirectory()).length });
            }
            res.json({ batches });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    // ─── Create batch folder ─────────────────────────────────────────────────
    async createBatch(req, res) {
        try {
            const { degree, department, year } = req.body;
            if (!degree || !department || !year)
                return res.status(400).json({ error: 'degree, department, and year are required' });
            // Sanitize dept: spaces → underscores so folder paths are always valid
            const safeDept  = department.trim().replace(/\s+/g, '_');
            const batchName = `${degree}_${safeDept}_${year}`.toUpperCase();
            ensureDir(path.join(GROUND_TRUTH_DIR, batchName));
            res.json({ batch: batchName, created: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    // ─── List students in a batch ────────────────────────────────────────────
    async listStudents(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath))
                return res.status(404).json({ error: 'Batch not found' });

            const entries  = await fsPromises.readdir(batchPath, { withFileTypes: true });
            const students = [];

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                const studentPath = path.join(batchPath, entry.name);
                const files       = await fsPromises.readdir(studentPath);
                const allImages   = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

                const infoPath = path.join(studentPath, '_info.json');
                let embeddingFiles = [], backupFiles = [], approvedFiles = [], scores = {};
                let hasInfoFile = false;
                if (fs.existsSync(infoPath)) {
                    try {
                        const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                        embeddingFiles = (info.embedding_files || []).filter(f => allImages.includes(f));
                        backupFiles    = (info.backup_files    || []).filter(f => allImages.includes(f));
                        approvedFiles  = (info.approved_files  || []).filter(f => allImages.includes(f));
                        scores         = info.scores || {};
                        hasInfoFile    = true;
                    } catch (_) {}
                }

                // No _info.json or no embedding list: apply the ≤5 rule
                if (!hasInfoFile || embeddingFiles.length === 0) {
                    if (allImages.length <= 5) {
                        embeddingFiles = [...allImages];
                        backupFiles    = [];
                    } else {
                        embeddingFiles = allImages.slice(0, 5);
                        backupFiles    = allImages.slice(5);
                    }
                }

                // If approved_files not set, retroactively approve all existing classified photos
                if (approvedFiles.length === 0 && (embeddingFiles.length > 0 || backupFiles.length > 0)) {
                    approvedFiles = [...new Set([...embeddingFiles, ...backupFiles])];
                }

                // Persist resolved state if _info.json is missing or incomplete
                if (!hasInfoFile) {
                    try {
                        await fsPromises.writeFile(infoPath, JSON.stringify({
                            embedding_files: embeddingFiles,
                            backup_files:    backupFiles,
                            approved_files:  approvedFiles,
                        }, null, 2));
                    } catch (_) {}
                } else if (approvedFiles.length > 0) {
                    // Patch in approved_files if it was missing from an existing file
                    try {
                        const current = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                        if (!current.approved_files || current.approved_files.length === 0) {
                            current.approved_files = approvedFiles;
                            await fsPromises.writeFile(infoPath, JSON.stringify(current, null, 2));
                        }
                    } catch (_) {}
                }

                const approvedSet = new Set(approvedFiles);
                const trackedSet  = new Set([...embeddingFiles, ...backupFiles]);
                const untracked   = allImages.filter(f => !trackedSet.has(f));
                const unapproved  = allImages.filter(f => !approvedSet.has(f));

                // Collect file mtime for "added on" display
                const statMap = {};
                for (const f of allImages) {
                    try {
                        const st = await fsPromises.stat(path.join(studentPath, f));
                        statMap[f] = (st.birthtime && st.birthtime.getTime() > 0 ? st.birthtime : st.mtime).toISOString();
                    } catch (_) { statMap[f] = null; }
                }

                const makeList = fnames => fnames.map(f => ({
                    filename: f,
                    url:      `/attendancemodule/ground-truth/photo/${batch}/${entry.name}/${f}`,
                    score:    scores[f] || null,
                    addedAt:  statMap[f] || null,
                }));

                students.push({
                    rollNo:         entry.name,
                    photoCount:     allImages.length,
                    embeddingFiles: makeList(embeddingFiles),
                    backupFiles:    makeList(backupFiles),
                    untrackedFiles: makeList(untracked),
                    unapprovedFiles:makeList(unapproved),
                    hasInfo:        embeddingFiles.length > 0 || backupFiles.length > 0,
                    photos:         makeList(allImages),
                    // Stats
                    approvedCount:  approvedFiles.length,
                    embeddingCount: embeddingFiles.length,
                    backupCount:    backupFiles.length,
                    unapprovedCount:unapproved.length,
                });
            }
            res.json({ batch, students });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    // ─── Serve a photo file ──────────────────────────────────────────────────
    async servePhoto(req, res) {
        try {
            const { batch, rollNo, filename } = req.params;
            const filePath = path.join(GROUND_TRUTH_DIR, batch, rollNo, filename);
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Photo not found' });
            res.sendFile(filePath);
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    // ─── Delete student ──────────────────────────────────────────────────────
    async deleteStudent(req, res) {
        try {
            const { batch, rollNo } = req.params;
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            if (!fs.existsSync(studentDir)) return res.status(404).json({ error: 'Student not found' });
            await fsPromises.rm(studentDir, { recursive: true, force: true });
            res.json({ message: `Removed ground truth for ${rollNo} in ${batch}` });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    // ─── Delete a single photo ───────────────────────────────────────────────
    async deletePhoto(req, res) {
    try {
        const { batch, rollNo, filename } = req.params;
        const filePath = path.join(GROUND_TRUTH_DIR, batch, rollNo, filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Photo not found' });
        await fsPromises.unlink(filePath);

        // NEW: Remove the deleted file from _info.json
        const infoPath = path.join(GROUND_TRUTH_DIR, batch, rollNo, '_info.json');
        if (fs.existsSync(infoPath)) {
            try {
                const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                info.embedding_files = (info.embedding_files || []).filter(f => f !== filename);
                info.backup_files    = (info.backup_files    || []).filter(f => f !== filename);
                info.approved_files  = (info.approved_files  || []).filter(f => f !== filename);
                await fsPromises.writeFile(infoPath, JSON.stringify(info, null, 2));
            } catch (_) {}
        }

        try {
    await rebuildSubjectPklsForStudent(rollNo, batch);
} catch (err) {
    console.warn(`[deletePhoto] PKL rebuild failed:`, err.message);
}

res.json({ message: `Removed ${filename}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
}

    // ─── Get student ground truth ────────────────────────────────────────────
    async getStudentGroundTruth(req, res) {
        try {
            const { batch, rollNo } = req.params;
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            if (!fs.existsSync(studentDir)) return res.status(404).json({ error: 'Student not found' });
            const files     = await fsPromises.readdir(studentDir);
            const allImages = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
            const infoPath  = path.join(studentDir, '_info.json');
            let embeddingFiles = [], backupFiles = [], scores = {};
            if (fs.existsSync(infoPath)) {
                const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                embeddingFiles = (info.embedding_files || []).filter(f => allImages.includes(f));
                backupFiles    = (info.backup_files    || []).filter(f => allImages.includes(f));
                scores         = info.scores || {};
            }
            const tracked   = new Set([...embeddingFiles, ...backupFiles]);
            const untracked = allImages.filter(f => !tracked.has(f));
            const makeList  = fnames => fnames.map(f => ({
                filename: f,
                url:   `/attendancemodule/ground-truth/photo/${batch}/${rollNo}/${f}`,
                score: scores[f] || null,
            }));
            res.json({
                batch, rollNo,
                embeddingFiles: makeList(embeddingFiles),
                backupFiles:    makeList(backupFiles),
                untrackedFiles: makeList(untracked),
                totalImages: allImages.length,
                hasInfo: embeddingFiles.length > 0 || backupFiles.length > 0,
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    // ─── Approve photos for a student ────────────────────────────────────────
    // Marks photos as approved and adds them to embedding (or backup if already have enough).
    // After approving, calls ML service to rebuild the embedding.
  async approvePhotos(req, res) {
    try {
        const { batch, rollNo, filenames } = req.body;
        if (!batch || !rollNo || !Array.isArray(filenames) || filenames.length === 0)
            return res.status(400).json({ error: 'batch, rollNo, and filenames[] required' });

        const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
        if (!fs.existsSync(studentDir))
            return res.status(404).json({ error: 'Student folder not found' });

        const allFiles = (await fsPromises.readdir(studentDir))
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        const infoPath = path.join(studentDir, '_info.json');
        let info = { embedding_files: [], backup_files: [], approved_files: [], scores: {} };
        if (fs.existsSync(infoPath)) {
            try { info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8')); } catch (_) {}
        }

        const validFiles = filenames.filter(f => allFiles.includes(f));
        const approvedSet  = new Set([...(info.approved_files  || []), ...validFiles]);
        const embeddingSet = new Set(info.embedding_files || []);
        const backupSet    = new Set(info.backup_files    || []);

        for (const f of validFiles) {
            embeddingSet.add(f);
            backupSet.delete(f);
        }

        info.approved_files  = [...approvedSet].filter(f => allFiles.includes(f));
        info.embedding_files = [...embeddingSet].filter(f => allFiles.includes(f));
        info.backup_files    = [...backupSet].filter(f => allFiles.includes(f));

        await fsPromises.writeFile(infoPath, JSON.stringify(info, null, 2));

        // ✅ Respond immediately — don't wait for ML
        res.json({
            ok: true,
            approvedCount:  info.approved_files.length,
            embeddingCount: info.embedding_files.length,
            backupCount:    info.backup_files.length,
            embeddingStatus: 'queued',
        });

        // 🔥 Rebuild embedding in background — fire and forget
        // REPLACE WITH THIS:
setImmediate(async () => {
    try {
        await syncUpdateStudentEmbedding(studentDir, rollNo, info.embedding_files);
        console.log(`[approvePhotos] Base embedding updated for ${rollNo}`);
        await rebuildSubjectPklsForStudent(rollNo, batch);
    } catch (err) {
        console.warn(`[approvePhotos] Background rebuild failed for ${rollNo}:`, err.message);
    }
});

    } catch (err) { res.status(500).json({ error: err.message }); }
}

    // ─── Update embedding for a student ─────────────────────────────────────
   async updateStudentEmbedding(req, res) {
    try {
        const { batch, rollNo, embeddingFiles } = req.body;
        if (!batch || !rollNo || !Array.isArray(embeddingFiles) || embeddingFiles.length === 0)
            return res.status(400).json({ error: 'batch, rollNo, and embeddingFiles[] required' });

        const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);

        // 1. Update the student embedding in ML service
        const response = await syncUpdateStudentEmbedding(studentDir, rollNo, embeddingFiles);

        // 2. Rebuild all subject PKLs where this student is enrolled — wait for completion
try {
    await rebuildSubjectPklsForStudent(rollNo, batch);
} catch (err) {
    console.warn(`[updateStudentEmbedding] PKL rebuild failed:`, err.message);
}

// 3. Respond only after rebuild is done
res.json({ ...response, embedding_files_used: embeddingFiles.length });


    } catch (err) { res.status(500).json({ error: mlError(err) }); }
}

    // ─── Generate embeddings + reload into Python memory ────────────────────
    async generateEmbeddings(req, res) {
        try {
            const { batch } = req.body;
            if (!batch) return res.status(400).json({ error: 'batch is required' });
            const buildResp = await buildBatchEmbeddingsPkl(
                path.join(GROUND_TRUTH_DIR, batch),
                path.join(EMBEDDINGS_DIR, `${batch}.pkl`)
            );
            await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {}, { timeout: 30000 });
            res.json({ ...buildResp, reloaded: true });
        } catch (err) { res.status(500).json({ error: mlError(err) }); }
    }

    // ─── RUN ATTENDANCE ──────────────────────────────────────────────────────
    //
    // Inputs  : room + slot + videoLink  (+ optional batch override)
    //
    // Flow    :
    //   STEP 1  room + slot → LockSem aggregate → gets from timetable:
    //             dept (e.g. "CIVIL ENGINEERING"), sem (e.g. "6"),
    //             session (e.g. "2024-25-ODD"), faculty, subject
    //
    //   STEP 2  dept + sem + session → deriveAdmissionYear()
    //             e.g. sem=6, session="2024-25-ODD" → 2022
    //           dept + admissionYear → findGroundTruthFolder()
    //             scans GROUND_TRUTH_DIR, normalises spaces/underscores
    //             returns the ACTUAL folder name that matches
    //             e.g. "BTECH_CIVIL ENGINEERING_2022"
    //
    //   STEP 3  fallback to req.body.batch if Step 2 found nothing
    //
    //   STEP 4  auto-build + reload embeddings for the matched batch
    //
    //   STEP 5  call Python ML service → return result + full metadata
    //
    async runAttendance(req, res) {
        try {
            const { videoLink, room, slot, date, batch: batchOverride } = req.body;

            if (!videoLink)     return res.status(400).json({ error: 'videoLink is required' });
            if (!room || !slot) return res.status(400).json({ error: 'room and slot are required' });

            // ── STEP 1 : LockSem lookup ──────────────────────────────────────
            let faculty = '', subject = '', sem = '', dept = '', session = '';
            let locksemId = null;

            try {
                // Strip hyphens/spaces from room for a flexible DB match
                // e.g. user types "lt203" → matches "LT-203", "LT 203", "lt203"
                const roomCore = room.trim().replace(/[\s\-\.]/g, ''); // "lt203"

                const pipeline = [
                    {
                        $match: {
                            slot,
                            // Broad regex: match room regardless of hyphens/spaces/case
                            // Converts "lt203" → regex /l[\s\-\.]*t[\s\-\.]*2[\s\-\.]*0[\s\-\.]*3/i
                            'slotData.room': {
                                $regex: new RegExp(
                                    roomCore.split('').join('[\\s\\-\\.]*'),
                                    'i'
                                )
                            }
                        }
                    },
                    {
                        $lookup: {
                            from:         'timetables',
                            localField:   'timetable',
                            foreignField: '_id',
                            as:           'timetableData',
                        }
                    },
                    { $unwind: '$timetableData' },
                    // prefer currently-active session, then most recently updated
                    { $sort: { 'timetableData.currentSession': -1, updated_at: -1 } },
                    { $limit: 1 }
                ];

                const docs = await LockSem.aggregate(pipeline);

                // Debug: log what was found for diagnosis
                console.log(`[runAttendance] Pipeline found ${docs.length} docs for slot="${slot}" roomCore="${roomCore}"`);
                if (docs.length === 0) {
                    // Extra debug: find ALL LockSem docs for this slot regardless of room
                    const allForSlot = await LockSem.find({ slot }).select('slotData.room sem code').lean();
                    const rooms = allForSlot.flatMap(d => d.slotData.map(sd => sd.room)).filter(Boolean);
                    console.log(`[runAttendance] Rooms in LockSem for slot="${slot}": ${[...new Set(rooms)].join(', ')}`);
                }

                if (docs.length > 0) {
                    const doc = docs[0];
                    const tt  = doc.timetableData;

                    // find the slotData entry — normalise both sides (strip hyphens/spaces)
                    // so "LT-203" matches user input "lt203"
                    const sd = doc.slotData.find(
                        s => s.room && normRoom(s.room) === normRoom(room)
                    );

                    faculty   = sd?.faculty || '';
                    subject   = sd?.subject || '';
                    sem       = doc.sem      || '';
                    dept      = tt.dept      || '';   // e.g. "CIVIL ENGINEERING"
                    session   = tt.session   || '';   // e.g. "2024-25-ODD"
                    locksemId = doc._id;

                    console.log('[runAttendance] LockSem found →',
                        { room, slot, dept, sem, session, faculty, subject });
                } else {
                    console.warn(`[runAttendance] No LockSem for room="${room}" slot="${slot}"`);
                }
            } catch (e) {
                console.warn('[runAttendance] LockSem lookup error:', e.message);
            }

            // ── STEP 2 : dept + sem → ground_truth folder ───────────────────
            //
            // deriveAdmissionYear: extracts the first 4-digit year from the
            // session string, then computes:
            //   admissionYear = sessionYear - ceil(sem/2) + 1
            //
            // findGroundTruthFolder: normalises dept name (spaces → underscores)
            // and scans the ground_truth directory for a matching folder.
            //
            let batch = null;

            if (dept && sem && session) {
                const admissionYear = deriveAdmissionYear(sem, session);
                console.log(`[runAttendance] admissionYear derived: ${admissionYear}`);

                if (admissionYear) {
                    const matched = findGroundTruthFolder('BTECH', dept, admissionYear);
                    if (matched) {
                        batch = matched;
                        console.log(`[runAttendance] Ground truth folder matched: "${batch}"`);
                    } else {
                        console.warn(
                            `[runAttendance] No ground_truth folder for ` +
                            `BTECH / "${dept}" / ${admissionYear}. ` +
                            `Available: ${fs.readdirSync(GROUND_TRUTH_DIR).join(', ')}`
                        );
                    }
                }
            }

            // ── STEP 3 : fallback to manual batch override ───────────────────
            if (!batch && batchOverride) {
                batch = batchOverride;
                console.log(`[runAttendance] Using manual batch override: "${batch}"`);
            }

            if (!batch) {
                return res.status(400).json({
                    error: 'Could not determine batch.',
                    details: [
                        !dept
                            ? `No LockSem entry found for room="${room}" slot="${slot}". ` +
                              `Ensure the timetable is locked for this room.`
                            : `LockSem found dept="${dept}" sem=${sem} but no matching ` +
                              `ground_truth folder exists. ` +
                              `Run Ground Truth Generation first, or use the batch override.`,
                    ],
                    debug: { room, slot, dept, sem, session },
                });
            }

            // ── STEP 4 : load subject-specific embeddings if available, else fall back to batch ─
try {
    // Build the subject-specific .pkl filename — same formula as embeddingController.js
    function safeSubjectLocal(raw) {
        return (raw || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/, '');
    }
    const semSafe      = (sem || '').toString().trim();
    const subjectSafe  = safeSubjectLocal(subject);
    const subjectPkl   = semSafe && subjectSafe ? `${semSafe}_${subjectSafe}.pkl` : null;
    const subjectPklPath = subjectPkl ? path.join(EMBEDDINGS_DIR, subjectPkl) : null;

    const health = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    const enrolledCount = health.data.students_enrolled || 0;

    if (subjectPklPath && fs.existsSync(subjectPklPath)) {
        // ── Subject-specific .pkl exists (generated via embedding page) ──
        // Always reload it so the ML service only recognises students
        // enrolled in THIS subject, not the entire batch.
        console.log(`[runAttendance] Loading subject-specific embeddings: ${subjectPkl}`);
        await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {
            pkl_path: subjectPklPath   // pass path so Python loads the right file
        }, { timeout: 30000 });
        console.log(`[runAttendance] Subject embeddings loaded from ${subjectPkl}`);

    } else {
        // ── No subject-specific .pkl — fall back to full batch ──
        if (subjectPkl) {
            console.warn(`[runAttendance] Subject pkl not found (${subjectPkl}), falling back to full batch.`);
        }
        if (enrolledCount === 0) {
            const batchDir = path.join(GROUND_TRUTH_DIR, batch);
            if (fs.existsSync(batchDir)) {
                console.log(`[runAttendance] Building batch embeddings for "${batch}"...`);
                await buildBatchEmbeddingsPkl(batchDir, path.join(EMBEDDINGS_DIR, `${batch}.pkl`));
            } else {
                console.warn(`[runAttendance] Folder does not exist: ${batchDir}`);
            }
            await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {}, { timeout: 30000 });
        }
        // If enrolledCount > 0 and no subject pkl, trust whatever is already loaded.
    }
} catch (e) {
    console.warn('[runAttendance] Embedding load skipped:', e.message);
}

            // ── STEP 5 : run ML face recognition ────────────────────────────
            const videoPath = videoLink.trim().replace(/^["']+|["']+$/g, '').trim();

            const mlResp = await axios.post(
                `${ML_SERVICE_URL}/process-video-with-rolllist`,
                {
                    videoPath,
                    threshold:              0.45,
                    frame_skip:             10,
                    roll_list:              [],
                    auto_present_threshold: 0.6,
                    review_threshold:       0.4,
                    min_detections:         3,
                    batch_name:             batch,
                    auto_enroll:            true,
                    auto_enroll_threshold:  0.6,
                    max_gt_images:          10,
                },
                { timeout: 600000 }
            );

            // Return ML result + all context so the frontend can display and save
            res.json({
                ...mlResp.data,
                metadata: {
                    room,
                    slot,
                    date,
                    batch,       // exact folder name used
                    dept,        // raw from timetable  e.g. "CIVIL ENGINEERING"
                    sem,
                    session,
                    faculty,
                    subject,
                    locksemId: locksemId ? String(locksemId) : null,
                },
            });

        } catch (err) {
            console.error('runAttendance error:', err.code, err.response?.data);
            res.status(500).json({ error: mlError(err) });
        }
    }

    // ─── Build per-student embedding ─────────────────────────────────────────
    async buildStudentEmbedding(req, res) {
        try {
            const { batch, rollNo, embeddingFiles } = req.body;
            if (!batch || !rollNo || !Array.isArray(embeddingFiles) || embeddingFiles.length !== 5)
                return res.status(400).json({ error: 'batch, rollNo, and exactly 5 embeddingFiles are required' });
            const response = await axios.post(
                `${ML_SERVICE_URL}/build-student-embedding`,
                { batch_name: batch, roll_no: rollNo, embedding_files: embeddingFiles },
                { timeout: 60000 }
            );
            res.json(response.data);
        } catch (err) { res.status(500).json({ error: mlError(err) }); }
    }

    // ─── Build embeddings for entire batch ───────────────────────────────────
    async buildBatchEmbeddings(req, res) {
        try {
            const { batch } = req.body;
            if (!batch) return res.status(400).json({ error: 'batch is required' });
            const response = await axios.post(
                `${ML_SERVICE_URL}/build-batch-embeddings`,
                {
                    photos_dir:  path.join(GROUND_TRUTH_DIR, batch),
                    output_path: path.join(EMBEDDINGS_DIR, `${batch}.pkl`)
                },
                { timeout: 300000 }
            );
            res.json(response.data);
        } catch (err) { res.status(500).json({ error: mlError(err) }); }
    }
}

module.exports = GroundTruthController;
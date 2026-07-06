// server/src/modules/attendanceModule/controllers/embeddingController.js
const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const axios      = require('axios');

const StudentEmbedding = require('../../../models/attendanceModule/studentEmbedding');
const Student          = require('../../../models/student');
const {
    updateStudentEmbedding: syncUpdateStudentEmbedding,
    buildBatchEmbeddingsPkl,
} = require('./embeddingSyncHelper');

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');
const EMBEDDINGS_DIR   = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings');

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(EMBEDDINGS_DIR);

// Sanitise subject so it can be used safely as part of a filename.
// "Digital Electronics (3rd Yr)" -> "Digital_Electronics_3rd_Yr"
function safeSubject(raw) {
    return (raw || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/, '');
}
// Returns academic session string, e.g. "2025-26"
function currentSession() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const start = month >= 8 ? year : year - 1;
    return `${start}-${String(start + 1).slice(2)}`;
}

// Builds folder path + filename: EMBEDDINGS_DIR/{session}/{deptSafe}/{subCode}_{subjectSafe}_{session}.pkl
function buildEmbeddingPath(sem, subject, dept, subjectCode) {
    const session      = currentSession();
    const subjectSafeStr = safeSubject(subject);
    const deptSafe     = safeSubject(dept || 'UNKNOWN');
    const subCodeSafe  = safeSubject(subjectCode || sem.toString());
    const filename     = `${subCodeSafe}_${subjectSafeStr}_${session}.pkl`;
    const folder       = path.join(EMBEDDINGS_DIR, session, deptSafe);
    return { filename, folder, fullPath: path.join(folder, filename), session };
}

// ── Resolve which embedding .pkl to use for a given sem+subject ──────────────
// Priority:
//   1. Subject-specific file  →  embeddings/{sem}_{subjectSafe}.pkl
//   2. Any existing .pkl whose name starts with {sem}_  (broadest fallback)
//   3. null  (no file found — ML service uses whatever is already loaded)
function resolveEmbeddingFile(sem, subject) {
    const semSafe      = (sem || '').toString().trim();
    const subjectSafe  = safeSubject(subject);
    const specificFile = `${semSafe}_${subjectSafe}.pkl`;
    const specificPath = path.join(EMBEDDINGS_DIR, specificFile);

    // 1. Subject-specific
    if (fs.existsSync(specificPath)) {
        return { file: specificFile, path: specificPath, type: 'subject' };
    }

    // 2. Fallback: any sem-prefixed .pkl (e.g. 6_all.pkl, 6_CSE.pkl …)
    if (fs.existsSync(EMBEDDINGS_DIR)) {
        const candidates = fs.readdirSync(EMBEDDINGS_DIR)
            .filter(f => f.startsWith(`${semSafe}_`) && f.endsWith('.pkl'))
            .sort();
        if (candidates.length > 0) {
            return {
                file: candidates[0],
                path: path.join(EMBEDDINGS_DIR, candidates[0]),
                type: 'fallback',
            };
        }
    }

    return null;
}

class EmbeddingController {

    // GET /attendancemodule/embeddings/enrolled-roll-nos/:sem/:dept
    // Returns roll nos of students enrolled in a given sem+dept from the Student collection.
    async getEnrolledRollNos(req, res) {
        try {
            const { sem, dept } = req.params;
            if (!sem) return res.status(400).json({ error: 'sem is required' });

            const filter = { sem: Number(sem) || sem };
            if (dept && dept.toUpperCase() !== 'ALL') {
                filter.dept = { $regex: new RegExp(dept, 'i') };
            }

            const students = await Student.find(filter).select('rollNo -_id').lean();
            const rollNos  = students.map(s => s.rollNo).filter(Boolean);

            res.json({ sem, dept: dept || 'ALL', rollNos, total: rollNos.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET /attendancemodule/embeddings/resolve-file/:sem/:subject
    // Returns which .pkl will be used for attendance recognition for this subject.
    // Frontend can call this before starting attendance to inform the operator.
    async resolveFile(req, res) {
        try {
            const { sem, subject } = req.params;
            const resolved = resolveEmbeddingFile(sem, subject);
            if (!resolved) {
                return res.json({
                    found: false,
                    type: null,
                    file: null,
                    message: 'No embedding file found. ML service will use currently loaded embeddings.',
                });
            }
            res.json({
                found: true,
                type:    resolved.type,   // 'subject' | 'fallback'
                file:    resolved.file,
                message: resolved.type === 'subject'
                    ? `Subject-specific embeddings found: ${resolved.file}`
                    : `No subject-specific file found. Using fallback: ${resolved.file}`,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET /attendancemodule/embeddings/status/:batch
    // Legacy: look up history by batch name
    async getStatus(req, res) {
        try {
            const { batch } = req.params;
            const records = await StudentEmbedding.find({ batch })
                .sort({ generatedAt: -1 })
                .lean();
            res.json({ batch, records });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET /attendancemodule/embeddings/status-by-file/:fileBase
    // New: look up history by embedding file base name (sem_Subject)
    // e.g.  /status-by-file/6_Digital_Electronics
    async getStatusByFile(req, res) {
        try {
            const fileBase = req.params.fileBase; // e.g. "6_Digital_Electronics"
            const records = await StudentEmbedding.find({
                embeddingFile: { $regex: fileBase, $options: 'i' }
            }).sort({ generatedAt: -1 }).lean();
            res.json({ fileBase, records });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // GET /attendancemodule/embeddings/list?session=2025-26&dept=Electronics_and_Communication_Engineering
    // Scans ml-data/embeddings/<session>/<dept>/ and returns parsed PKL metadata
    async listEmbeddingsInFolder(req, res) {
        try {
            const { session, dept } = req.query;
            if (!session || !dept) {
                return res.status(400).json({ error: 'session and dept are required' });
            }
            const deptSafe = safeSubject(dept);
            const folder = path.join(EMBEDDINGS_DIR, session, deptSafe);

            if (!fs.existsSync(folder)) {
                return res.json({ session, dept: deptSafe, files: [] });
            }

            const files = fs.readdirSync(folder)
                .filter(f => f.endsWith('.pkl'))
                .map(filename => {
                    // Parse "ECPC_306_DSP_G1_2025-26.pkl" → subCode + subject guess
                    const base = filename.replace(/\.pkl$/i, '');
                    const parts = base.split('_');
                    const subCode = parts.slice(0, 2).join('_'); // e.g. "ECPC_306"
                    const subjectGuess = parts.slice(2, -1).join('_'); // strips session at end
                    return {
                        filename,
                        pklPath: path.join(folder, filename),
                        subCode,
                        subjectGuess,
                        session,
                        dept: deptSafe,
                    };
                });

            res.json({ session, dept: deptSafe, files });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET /attendancemodule/embeddings/check?dept=ECE&subject=Digital Signal Processing&session=2025-26
    // Fuzzy-matches a subject string (or code) to an available PKL in the dept folder
    async checkEmbeddingForSubject(req, res) {
        try {
            const { dept, subject, session, subCode } = req.query;
            if (!dept || (!subject && !subCode)) {
                return res.status(400).json({ error: 'dept and (subject or subCode) are required' });
            }

            const deptSafe = safeSubject(dept);
            const sessionToUse = session || (() => {
                const now = new Date();
                const y = now.getFullYear();
                const start = (now.getMonth() + 1) >= 8 ? y : y - 1;
                return `${start}-${String(start + 1).slice(2)}`;
            })();

            const folder = path.join(EMBEDDINGS_DIR, sessionToUse, deptSafe);
            if (!fs.existsSync(folder)) {
                return res.json({ found: false, reason: 'No embeddings folder for this dept/session' });
            }

            const pklFiles = fs.readdirSync(folder).filter(f => f.endsWith('.pkl'));
            if (pklFiles.length === 0) {
                return res.json({ found: false, reason: 'No PKL files in dept folder' });
            }

            // 1. Exact subCode match (e.g. "ECPC_306")
            if (subCode) {
                const codeSafe = safeSubject(subCode).toLowerCase();
                const exact = pklFiles.find(f => f.toLowerCase().startsWith(codeSafe.toLowerCase()));
                if (exact) {
                    return res.json({
                        found: true, filename: exact,
                        pklPath: path.join(folder, exact), matchType: 'subCode',
                    });
                }
            }

            // 2. Fuzzy subject-name match — normalize and look for token overlap
            if (subject) {
                const subjectTokens = safeSubject(subject).toLowerCase().split('_').filter(Boolean);
                let best = null, bestScore = 0;
                for (const f of pklFiles) {
                    const fileTokens = f.replace(/\.pkl$/i, '').toLowerCase().split('_');
                    const overlap = subjectTokens.filter(t => fileTokens.includes(t)).length;
                    if (overlap > bestScore) {
                        bestScore = overlap;
                        best = f;
                    }
                }
                if (best && bestScore > 0) {
                    return res.json({
                        found: true, filename: best,
                        pklPath: path.join(folder, best), matchType: 'fuzzy', matchScore: bestScore,
                    });
                }
            }

            res.json({ found: false, reason: 'No matching PKL found', available: pklFiles });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getHistoryByDept(req, res) {
    try {
        const { dept, sem, subject } = req.query;
        const filter = dept ? { dept: { $regex: dept, $options: 'i' } } : {};
        if (sem)     filter.sem     = sem;
        if (subject) filter.subject = { $regex: subject.trim(), $options: 'i' };
        const records = await StudentEmbedding.find(filter)
            .sort({ generatedAt: -1 })
            .lean();
        res.json({ dept: dept || 'ALL', records });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

    // GET /attendancemodule/embeddings/list-files
async listFiles(req, res) {
    try {
        const EMBEDDINGS_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings');

        const files = await fsPromises.readdir(EMBEDDINGS_DIR);
        const pklFiles = files.filter(f => f.endsWith('.pkl'));

        const enriched = await Promise.all(pklFiles.map(async (filename) => {
            const stat = await fsPromises.stat(path.join(EMBEDDINGS_DIR, filename));
            const rec  = await StudentEmbedding.findOne({ embeddingFile: filename })
                               .sort({ generatedAt: -1 }).lean();
            return {
                filename,
                sizeKB:        Math.round(stat.size / 1024),
                modifiedAt:    stat.mtime,
                sem:           rec?.sem             || null,
                subject:       rec?.subject         || null,
                dept:          rec?.dept            || null,
                rollNos:       rec?.rollNos         || [],
                missedCount:   rec?.missedRollNos?.length || 0,
                missedRollNos: rec?.missedRollNos   || [],
                recordId:      rec?._id             || null,
                generatedAt:   rec?.generatedAt     || stat.mtime,
                uploadedDirect: rec?.uploadedDirect || false,
            };
        }));

        res.json({ files: enriched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async listFilesByDept(req, res) {
    try {
        const { dept } = req.query;
        const EMBEDDINGS_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings');

        if (!fs.existsSync(EMBEDDINGS_DIR)) {
            return res.json({ files: [] });
        }

        // Recursively collect all .pkl files under EMBEDDINGS_DIR
        function collectPkls(dir) {
            let results = [];
            for (const entry of fs.readdirSync(dir)) {
                const full = path.join(dir, entry);
                const stat = fs.statSync(full);
                if (stat.isDirectory()) {
                    results = results.concat(collectPkls(full));
                } else if (entry.endsWith('.pkl')) {
                    results.push({ fullPath: full, filename: entry, relPath: path.relative(EMBEDDINGS_DIR, full) });
                }
            }
            return results;
        }

        let allFiles = collectPkls(EMBEDDINGS_DIR);

        // Filter by dept if provided — match against folder path
        if (dept && dept.trim()) {
            const deptNorm = dept.trim().replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
            allFiles = allFiles.filter(f => f.relPath.toLowerCase().includes(deptNorm));
        }

        const enriched = await Promise.all(allFiles.map(async ({ fullPath, filename, relPath }) => {
            const stat = fs.statSync(fullPath);
            // Try to find a matching DB record by filename
            const rec = await StudentEmbedding.findOne({ embeddingFile: filename })
                .sort({ generatedAt: -1 }).lean();
                console.log('listFilesByDept → file:', filename, '| rec found:', !!rec, '| rollNos:', rec?.rollNos?.length ?? 'none');
            return {
                filename,
                relPath,
                sizeKB:        Math.round(stat.size / 1024),
                modifiedAt:    stat.mtime,
                sem:           rec?.sem             || null,
                subject:       rec?.subject         || null,
                dept:          rec?.dept            || null,
                rollNos:       rec?.rollNos         || [],
                missedRollNos: rec?.missedRollNos   || [],
                missedCount:   rec?.missedRollNos?.length || 0,
                recordId:      rec?._id             || null,
                generatedAt:   rec?.generatedAt     || stat.mtime,
                status:        rec?.status          || 'unknown',
            };
        }));

        res.json({ files: enriched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /attendancemodule/embeddings/upload-pkl
// Multipart form: file (.pkl), sem, subject, dept, rollNos (JSON or comma-sep string)
uploadPkl() {
    const multer = require('multer');
    const EMBEDDINGS_DIR = path.join(__dirname, '..', '..', '..', '..', 'embeddings');
    const upload = multer({
        storage: multer.diskStorage({
            destination: (_req, _file, cb) => cb(null, EMBEDDINGS_DIR),
            filename:    (_req, file, cb) => cb(null, file.originalname),
        }),
        fileFilter: (_req, file, cb) => {
            if (file.originalname.endsWith('.pkl')) cb(null, true);
            else cb(new Error('Only .pkl files are allowed'));
        },
        limits: { fileSize: 500 * 1024 * 1024 },
    }).single('file');

    return async (req, res) => {
        upload(req, res, async (multerErr) => {
            if (multerErr) return res.status(400).json({ error: multerErr.message });
            if (!req.file) return res.status(400).json({ error: 'No .pkl file uploaded' });

            const { sem, subject, dept } = req.body;
            if (!sem || !subject) {
                require('fs').unlink(req.file.path, () => {});
                return res.status(400).json({ error: 'sem and subject are required' });
            }

            // Parse rollNos
            let rollNos = [];
            try {
                const raw = req.body.rollNos || '[]';
                rollNos = Array.isArray(raw) ? raw
                    : raw.startsWith('[') ? JSON.parse(raw)
                    : raw.split(/[\n,;\s]+/).map(r => r.trim().toUpperCase()).filter(Boolean);
            } catch (_) {}

            // Rename to canonical {sem}_{safeSubject}.pkl
            const canonicalFile = `${sem.trim()}_${safeSubject(subject)}.pkl`;
            let finalFile = req.file.originalname;
            if (finalFile !== canonicalFile) {
                const newPath = path.join(EMBEDDINGS_DIR, canonicalFile);
                try { await fsPromises.rename(req.file.path, newPath); finalFile = canonicalFile; } catch (_) {}
            }

            try {
                const record = await StudentEmbedding.create({
                    sem: sem.trim(), subject: subject.trim(),
                    dept: (dept || '').trim().toUpperCase(),
                    embeddingFile: finalFile, rollNos,
                    missedRollNos: [], uploadedDirect: true,
                    status: 'done', studentsTotal: rollNos.length,
                    studentsSuccess: rollNos.length, studentsFailed: 0,
                    generatedAt: new Date(),
                });

                try {
                    // Bytes, not a path — the ML service may run on a separate machine.
                    const pklBytes = fs.readFileSync(path.join(EMBEDDINGS_DIR, finalFile));
                    await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {
                        pkl_data: pklBytes.toString('base64'),
                    }, { timeout: 30000 });
                } catch (_) {}

                res.json({ ok: true, embeddingFile: finalFile, rollNosCount: rollNos.length, recordId: record._id });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    };
}

    // POST /attendancemodule/embeddings/generate
    // Body: { sem, subject, dept, rollNos[]? }
    // rollNos is now OPTIONAL. If omitted, roll nos are auto-fetched from Student
    // collection by sem+dept. If dept is also omitted, ALL students in that sem are used.
    // File name format: {sem}_{subjectSafe}.pkl  e.g. 6_Digital_Electronics.pkl
    async generate(req, res) {
        let { sem, subject, dept, rollNos, instituteWise } = req.body;
        instituteWise = !!instituteWise;

        if (!subject || !subject.trim()) {
            return res.status(400).json({ error: 'subject is required' });
        }
        if (!sem || !sem.toString().trim()) {
            return res.status(400).json({ error: 'sem is required' });
        }

        // ── Auto-fetch roll nos if not supplied ───────────────────────────────
        if (!Array.isArray(rollNos) || rollNos.length === 0) {
            const filter = { sem: Number(sem) || sem };
            if (dept && !instituteWise) {
                filter.dept = { $regex: new RegExp(dept, 'i') };
            }
            const students = await Student.find(filter).select('rollNo -_id').lean();
            rollNos = students.map(s => s.rollNo).filter(Boolean);

            if (rollNos.length === 0) {
                return res.status(400).json({
                    error: `No students found for sem=${sem}${dept ? ', dept=' + dept : ''}. ` +
                           `Either pass rollNos[] explicitly or make sure students are registered.`,
                });
            }
        }

        // SSE so frontend can show per-student progress live
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        try {   // ← ADD THIS

        const sse = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            if (typeof res.flush === 'function') res.flush();
        };

        // New file name format: {sem}_{subjectSafe}.pkl
        const semSafe = sem.toString().trim();
        const subjectCode = (req.body.subjectCode || '').trim();
        const { filename: embeddingFile, folder: embFolder, fullPath: outputPath, session: sessionStr } = buildEmbeddingPath(semSafe, subject, dept, subjectCode);
        ensureDir(embFolder);

        // For GT lookup we still need a batch-like folder path.
        // GT photos are stored under ground_truth/{batch}/{rollNo}/
        // Since we no longer get batch from frontend, we try to find the student
        // by scanning for any batch folder that contains the roll number.
        // Alternatively, if dept is supplied we can narrow down. For now we scan.

        let record = await StudentEmbedding.create({
    sem:             semSafe,
    subject:         subject.trim(),
    dept:            (dept || '').trim().toUpperCase(),
    embeddingFile,
    session:         sessionStr,
    subjectCode,
    rollNos,
    missedRollNos:   [],
    status:          'pending',
    studentsTotal:   rollNos.length,
    studentsSuccess: 0,
    studentsFailed:  0,
    generatedAt:     new Date(),
    lastUpdatedAt:   new Date(),
});

        let success = 0, failed = 0;
        const failedList    = [];
        const missedRollNos = [];
        const processedRollNos = []; // roll nos that actually got embeddings updated

        sse({ type: 'start', total: rollNos.length, sem: semSafe, subject: subject.trim(), embeddingFile });

        // Helper: find the GT batch folder that contains a given roll number.
        // When instituteWise=true scans all batch folders; otherwise only dept-matching ones.
        async function findStudentDir(rollNo) {
            if (!fs.existsSync(GROUND_TRUTH_DIR)) return null;
            const batchFolders = await fsPromises.readdir(GROUND_TRUTH_DIR);
            const candidates = instituteWise
                ? batchFolders
                : batchFolders.filter(b => b.toUpperCase().includes((dept || '').toUpperCase()));
            for (const batch of candidates) {
                const candidate = path.join(GROUND_TRUTH_DIR, batch, rollNo);
                if (fs.existsSync(candidate)) return { dir: candidate, batch };
            }
            return null;
        }

        for (const rollNo of rollNos) {
            const found = await findStudentDir(rollNo);

            if (!found) {
                const reason = instituteWise
                    ? 'Not found in any department — check roll no and verify ground truth exists'
                    : 'Not found in dept ground truth — try Institute Wise search';
                sse({ type: 'student', rollNo, status: 'failed', reason });
                failed++;
                failedList.push({ rollNo, reason });
                missedRollNos.push({ rollNo, reason });
                continue;
            }

            const { dir: studentDir, batch: batchName } = found;
            const infoPath = path.join(studentDir, '_info.json');
            let embeddingFiles = [];

            if (fs.existsSync(infoPath)) {
                try {
                    const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                    embeddingFiles = info.embedding_files || [];
                } catch (_) {}
            }

            
            if (!embeddingFiles.length) {
                sse({ type: 'student', rollNo, status: 'failed', reason: 'No embedding photos marked in _info.json' });
                failed++;
                failedList.push({ rollNo, reason: 'No embedding photos marked in _info.json' });
                missedRollNos.push({ rollNo, reason: 'No embedding photos marked in _info.json' });
                continue;
            }

            

            sse({ type: 'student', rollNo, status: 'processing', photoCount: embeddingFiles.length });
            
             // ── HEARTBEAT START ──────────────────────────────────────────────
    const heartbeat = setInterval(() => {
        try { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } catch (_) {}
    }, 15000);
            

            try {
                const mlResult = await syncUpdateStudentEmbedding(studentDir, rollNo, embeddingFiles);

                sse({
                    type:        'student',
                    rollNo,
                    status:      'done',
                    photosUsed:  mlResult.embedding_files_used || embeddingFiles.length,
                    embeddingFile,
                });
                success++;
                processedRollNos.push({ rollNo, batch: batchName });
            } catch (err) {
                const reason = err.response?.data?.detail || err.message || 'ML error';
                sse({ type: 'student', rollNo, status: 'failed', reason });
                failed++;
                failedList.push({ rollNo, reason });
                missedRollNos.push({ rollNo, reason });
            } finally {
    clearInterval(heartbeat);  // ← THIS WAS MISSING
}
        }

        // Build a subject-specific .pkl from only these roll numbers.
        // We need a batchDir to pass to the ML service. Use the most common batch
        // found among processed students, or GROUND_TRUTH_DIR itself.
        if (processedRollNos.length === 0) {
    sse({ type: 'warning', message: 'No students processed successfully — skipping embedding build.' });
} else {
sse({ type: 'stage', message: `Building subject embedding file: ${embeddingFile}...` });

try {
            // Collect unique batch names from processed students
            const batchCounts = {};
            for (const { batch } of processedRollNos) {
                batchCounts[batch] = (batchCounts[batch] || 0) + 1;
            }
            const primaryBatch = Object.keys(batchCounts).sort((a, b) => batchCounts[b] - batchCounts[a])[0];
            const batchDir = primaryBatch
                ? path.join(GROUND_TRUTH_DIR, primaryBatch)
                : GROUND_TRUTH_DIR;

            await buildBatchEmbeddingsPkl(batchDir, outputPath);

            // Send the .pkl we just built as bytes — never a path, since the
            // ML service may run on a separate machine with no access to this
            // disk. An empty-body reload would otherwise fall back to Python's
            // own stale local embeddings_db.pkl instead of what we just built.
            const pklBytes = fs.readFileSync(outputPath);
            await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {
                pkl_data: pklBytes.toString('base64'),
            }, { timeout: 30000 });
            sse({ type: 'stage', message: 'Subject embeddings reloaded into ML service.' });
        } catch (err) {
            sse({ type: 'warning', message: `Embedding build step failed: ${err.message}` });
        }
}

       record.status          = failed === rollNos.length ? 'failed' : 'done';
        record.studentsSuccess = success;
        record.studentsFailed  = failed;
        record.missedRollNos   = missedRollNos;
        record.generatedAt     = new Date();
        record.lastUpdatedAt   = new Date();
        await record.save();
        sse({
            type:          'done',
            sem:           semSafe,
            subject:       subject.trim(),
            dept:          (dept || '').trim(),
            embeddingFile,
            success,
            failed,
            failedList,
            missedRollNos,
            recordId:      record._id,
        });

        res.end();
    }catch (fatalErr) {   // ← ADD FROM HERE
            console.error('FATAL in generate():', fatalErr);
            try {
                res.write(`data: ${JSON.stringify({ type: 'error', message: fatalErr.message })}\n\n`);
                res.end();
            } catch (_) {}
        }   // ← TO HERE
    }

    // DELETE /attendancemodule/embeddings/file  — deletes physical .pkl + all DB records
    async deleteFile(req, res) {
        const { filename, relPath } = req.body;
        if (!filename) return res.status(400).json({ error: 'filename required' });

        const filePath = path.join(EMBEDDINGS_DIR, relPath || filename);
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
            console.error('deleteFile: could not remove physical file:', err.message);
        }

        const result = await StudentEmbedding.deleteMany({ embeddingFile: filename });
        res.json({ ok: true, deleted: filename, dbDeleted: result.deletedCount });
    }

    // DELETE /attendancemodule/embeddings/:id
    async deleteRecord(req, res) {
        try {
            await StudentEmbedding.findByIdAndDelete(req.params.id);
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // POST /attendancemodule/embeddings/upload-roll-nos-xlsx
// Multipart: file (.xlsx), subjectId, dept (optional, for GT check)
uploadRollNosXlsx() {
    const multer  = require('multer');
    const XLSX    = require('xlsx');
    const Subject = require('../../../models/subject');   // ← path to your subject.js

    const upload = multer({
        storage: multer.memoryStorage(),
        limits:  { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.originalname.match(/\.(xlsx|xls|csv)$/i)) cb(null, true);
            else cb(new Error('Only .xlsx / .xls / .csv files are allowed'));
        },
    }).single('file');

    return async (req, res) => {
        upload(req, res, async (multerErr) => {
            if (multerErr) return res.status(400).json({ error: multerErr.message });
            if (!req.file)  return res.status(400).json({ error: 'No file uploaded' });

            const { subjectId, dept, embeddingFile } = req.body;
            if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

            // ── Parse roll numbers from the spreadsheet ──────────────────────
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheet    = workbook.Sheets[workbook.SheetNames[0]];
            const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const rollNos = rows
                .flat()
                .map(v => String(v ?? '').trim().toUpperCase())
                .filter(v => v.length > 3 && !/^(roll|rollno|roll_no|sno|sr\.?\s*no)/i.test(v)); // skip header cells

            if (rollNos.length === 0) {
                return res.status(400).json({ error: 'No valid roll numbers found in the file' });
            }

            // ── Check which roll nos are missing from ground truth ────────────
            const missedGroundTruth = [];
            for (const rollNo of rollNos) {
                if (!fs.existsSync(GROUND_TRUTH_DIR)) { missedGroundTruth.push(rollNo); continue; }
                const batchFolders = fs.readdirSync(GROUND_TRUTH_DIR);
                const hasSome = batchFolders.some(batch => {
                    const candidate = path.join(GROUND_TRUTH_DIR, batch, rollNo);
                    return fs.existsSync(candidate);
                });
                if (!hasSome) missedGroundTruth.push(rollNo);
            }

            // ── Update the Subject document ──────────────────────────────────
            const update = {
                enrolledRollNos:    rollNos,
                missedGroundTruth,
                embeddingUpdatedAt: new Date(),
            };
            if (embeddingFile && embeddingFile.trim()) {
                update.embeddingFile = embeddingFile.trim();
            }

            const updated = await Subject.findByIdAndUpdate(subjectId, update, { new: true });
            if (!updated) return res.status(404).json({ error: 'Subject not found' });

            res.json({
                ok:               true,
                subjectId,
                total:            rollNos.length,
                missedCount:      missedGroundTruth.length,
                missedGroundTruth,
                embeddingFile:    updated.embeddingFile,
            });
        });
    };
}
}

module.exports = EmbeddingController;
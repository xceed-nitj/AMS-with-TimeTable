// server/src/modules/attendanceModule/controllers/embeddingController.js
const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const axios      = require('axios');

const StudentEmbedding = require('../../../models/attendanceModule/studentEmbedding');

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ground_truth');
const EMBEDDINGS_DIR   = path.join(__dirname, '..', '..', '..', '..', 'embeddings');

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(EMBEDDINGS_DIR);

// Sanitise subject so it can be used safely as part of a filename.
// "Digital Electronics (3rd Yr)" -> "Digital_Electronics_3rd_Yr"
function safeSubject(raw) {
    return (raw || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/, '');
}

class EmbeddingController {

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

    // POST /attendancemodule/embeddings/generate
    // Body: { sem, subject, dept, rollNos[] }
    // File name format: {sem}_{subjectSafe}.pkl  e.g. 6_Digital_Electronics.pkl
    async generate(req, res) {
        const { sem, subject, dept, rollNos } = req.body;

        if (!Array.isArray(rollNos) || rollNos.length === 0) {
            return res.status(400).json({ error: 'rollNos[] is required and must not be empty' });
        }
        if (!subject || !subject.trim()) {
            return res.status(400).json({ error: 'subject is required' });
        }
        if (!sem || !sem.toString().trim()) {
            return res.status(400).json({ error: 'sem is required' });
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
        const semSafe       = sem.toString().trim();
        const subjectSafe   = safeSubject(subject);
        const embeddingFile = `${semSafe}_${subjectSafe}.pkl`;
        const outputPath    = path.join(EMBEDDINGS_DIR, embeddingFile);

        // For GT lookup we still need a batch-like folder path.
        // GT photos are stored under ground_truth/{batch}/{rollNo}/
        // Since we no longer get batch from frontend, we try to find the student
        // by scanning for any batch folder that contains the roll number.
        // Alternatively, if dept is supplied we can narrow down. For now we scan.

        let record = await StudentEmbedding.create({
            sem:          semSafe,
            subject:      subject.trim(),
            dept:         (dept || '').trim().toUpperCase(),
            embeddingFile,
            rollNos,
            missedRollNos: [],
            status: 'pending',
            studentsTotal: rollNos.length,
        });

        let success = 0, failed = 0;
        const failedList    = [];
        const missedRollNos = [];
        const processedRollNos = []; // roll nos that actually got embeddings updated

        sse({ type: 'start', total: rollNos.length, sem: semSafe, subject: subject.trim(), embeddingFile });

        // Helper: find the GT batch folder that contains a given roll number.
        // Checks every subfolder under ground_truth/ for a matching roll dir.
        // If dept is supplied, prefers batch folders whose name contains dept.
        async function findStudentDir(rollNo) {
            if (!fs.existsSync(GROUND_TRUTH_DIR)) return null;
            const batchFolders = await fsPromises.readdir(GROUND_TRUTH_DIR);
            // Prefer dept-matching batches first
            const sorted = dept
                ? [
                    ...batchFolders.filter(b => b.toUpperCase().includes(dept.toUpperCase())),
                    ...batchFolders.filter(b => !b.toUpperCase().includes(dept.toUpperCase())),
                  ]
                : batchFolders;
            for (const batch of sorted) {
                const candidate = path.join(GROUND_TRUTH_DIR, batch, rollNo);
                if (fs.existsSync(candidate)) return { dir: candidate, batch };
            }
            return null;
        }

        for (const rollNo of rollNos) {
            const found = await findStudentDir(rollNo);

            if (!found) {
                sse({ type: 'student', rollNo, status: 'failed', reason: 'No ground truth folder' });
                failed++;
                failedList.push({ rollNo, reason: 'No ground truth folder' });
                missedRollNos.push({ rollNo, reason: 'No ground truth folder' });
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

            // Fallback: first 5 images if no _info.json
            if (!embeddingFiles.length) {
                const files = await fsPromises.readdir(studentDir);
                embeddingFiles = files
                    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                    .sort()
                    .slice(0, 5);
            }

            if (!embeddingFiles.length) {
                sse({ type: 'student', rollNo, status: 'failed', reason: 'No photos found' });
                failed++;
                failedList.push({ rollNo, reason: 'No photos found' });
                missedRollNos.push({ rollNo, reason: 'No photos found' });
                continue;
            }

            sse({ type: 'student', rollNo, status: 'processing', photoCount: embeddingFiles.length });
            
             // ── HEARTBEAT START ──────────────────────────────────────────────
    const heartbeat = setInterval(() => {
        try { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } catch (_) {}
    }, 15000);
            

            try {
                const mlRes = await axios.post(
                    `${ML_SERVICE_URL}/update-student-embedding`,
                    {
                        batch_name:      batchName,
                        roll_no:         rollNo,
                        embedding_files: embeddingFiles,
                    },
                    { timeout: 120000 }
                );

                sse({
                    type:        'student',
                    rollNo,
                    status:      'done',
                    photosUsed:  mlRes.data.embedding_files_used || embeddingFiles.length,
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

            await axios.post(
                `${ML_SERVICE_URL}/build-embeddings-sync`,
                {
                    photos_dir:  batchDir,
                    output_path: outputPath,
                    roll_nos:    rollNos,
                },
                { timeout: 900000 }
            );

            await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {}, { timeout: 30000 });
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

    // DELETE /attendancemodule/embeddings/:id
    async deleteRecord(req, res) {
        try {
            await StudentEmbedding.findByIdAndDelete(req.params.id);
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = EmbeddingController;

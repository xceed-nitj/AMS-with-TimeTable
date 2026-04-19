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
// "Digital Electronics (3rd Yr)" → "Digital_Electronics_3rd_Yr"
function safeSubject(raw) {
    return (raw || '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

class EmbeddingController {

    // GET /attendancemodule/embeddings/status/:batch
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

    // POST /attendancemodule/embeddings/generate
    // Body: { batch, subject, rollNos: ['21BCE001', ...] }
    async generate(req, res) {
    const { batch, subject, subjectCode, sem, degree, rollNos } = req.body;

        if (!batch || !Array.isArray(rollNos) || rollNos.length === 0) {
            return res.status(400).json({ error: 'batch and rollNos[] are required' });
        }

        // ── Subject is now REQUIRED for a meaningful filename ──────────────
        if (!subject || !subject.trim()) {
            return res.status(400).json({ error: 'subject is required' });
        }

        // SSE so frontend can show per-student progress live
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sse = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

        // ── Per-subject embedding file name ────────────────────────────────
        // e.g.  BTECH_ECE_2023_Digital_Electronics.pkl
        const subjectSafe   = safeSubject(subject);
        const embeddingFile = `${batch}_${subjectSafe}.pkl`;
        const outputPath    = path.join(EMBEDDINGS_DIR, embeddingFile);

        let record = await StudentEmbedding.create({
        batch,
        degree:      (degree      || '').trim(),
        sem:         (sem         || '').trim(),
        subject:     subject.trim(),
        subjectCode: (subjectCode || '').trim(),
        embeddingFile,
        rollNos,
        missedRollNos: [],
        status: 'pending',
        studentsTotal: rollNos.length,
});

        let success = 0, failed = 0;
        const failedList    = [];    // keep for SSE compat
        const missedRollNos = [];

        sse({ type: 'start', total: rollNos.length, batch, subject, embeddingFile });

        for (const rollNo of rollNos) {
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);

            if (!fs.existsSync(studentDir)) {
                sse({ type: 'student', rollNo, status: 'failed', reason: 'No ground truth folder' });
                failed++;
                failedList.push({ rollNo, reason: 'No ground truth folder' });
                missedRollNos.push({ rollNo, reason: 'No ground truth folder' });
                continue;
            }

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

            try {
                const mlRes = await axios.post(
                    `${ML_SERVICE_URL}/update-student-embedding`,
                    {
                        batch_name:      batch,
                        roll_no:         rollNo,
                        embedding_files: embeddingFiles,
                    },
                    { timeout: 60000 }
                );

                sse({
                    type:        'student',
                    rollNo,
                    status:      'done',
                    photosUsed:  mlRes.data.embedding_files_used || embeddingFiles.length,
                    embeddingFile,
                });
                success++;
            } catch (err) {
                const reason = err.response?.data?.detail || err.message || 'ML error';
                sse({ type: 'student', rollNo, status: 'failed', reason });
                failed++;
                failedList.push({ rollNo, reason });
                missedRollNos.push({ rollNo, reason });
            }
        }

        // ── Build a subject-specific .pkl from only these roll numbers ──────
        sse({ type: 'stage', message: `Building subject embedding file: ${embeddingFile}…` });

        try {
            const batchDir = path.join(GROUND_TRUTH_DIR, batch);

            await axios.post(
                `${ML_SERVICE_URL}/build-embeddings-sync`,
                {
                    photos_dir:  batchDir,
                    output_path: outputPath,
                    roll_nos:    rollNos,   // ML service filters to only these students
                },
                { timeout: 300000 }
            );

            await axios.post(`${ML_SERVICE_URL}/reload-embeddings`, {}, { timeout: 30000 });

            sse({ type: 'stage', message: 'Subject embeddings reloaded into ML service ✓' });
        } catch (err) {
            sse({ type: 'warning', message: `Embedding build failed: ${err.message}` });
        }

        record.status          = failed === rollNos.length ? 'failed' : 'done';
        record.studentsSuccess = success;
        record.studentsFailed  = failed;
        record.missedRollNos   = missedRollNos;
        record.generatedAt     = new Date();
        await record.save();

        sse({
            type:          'done',
            batch,
            degree:        (degree      || '').trim(),
            sem:           (sem         || '').trim(),
            subject:       subject.trim(),
            subjectCode:   (subjectCode || '').trim(),
            embeddingFile,
            success,
            failed,
            failedList,
            missedRollNos,
            recordId:      record._id,
});

        res.end();
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

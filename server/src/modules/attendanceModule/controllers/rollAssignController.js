// server/src/modules/attendanceModule/controllers/rollAssignController.js

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const axios      = require('axios');

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ground_truth');
const ERP_PHOTOS_DIR   = process.env.ERP_PHOTOS_DIR ||
                          path.join(__dirname, '..', '..', '..', '..', 'erp_photos');

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(GROUND_TRUTH_DIR);
ensureDir(ERP_PHOTOS_DIR);

// ── Flags stored per batch: ground_truth/{batch}/_flags.json ──
function flagsPath(batch) {
    return path.join(GROUND_TRUTH_DIR, batch, '_flags.json');
}
async function readFlags(batch) {
    const fp = flagsPath(batch);
    if (!fs.existsSync(fp)) return [];
    return JSON.parse(await fsPromises.readFile(fp, 'utf8'));
}
async function writeFlags(batch, flags) {
    await fsPromises.writeFile(flagsPath(batch), JSON.stringify(flags, null, 2));
}

class RollAssignController {

    // ─── List unassigned (person_XXX) and assigned folders in a batch ──
    async listClusters(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const flags   = await readFlags(batch);
            const flagged = new Set(flags.filter(f => !f.resolved).map(f => f.folderName));

            const entries = await fsPromises.readdir(batchPath, { withFileTypes: true });
            const unassigned = [];
            const assigned   = [];

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                const folderPath = path.join(batchPath, entry.name);
                const files      = await fsPromises.readdir(folderPath);
                const images     = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

                // Read _info.json to get embedding files for assigned folders
                let embeddingFiles = null;
                const infoPath = path.join(folderPath, '_info.json');
                if (fs.existsSync(infoPath)) {
                    try {
                        const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                        const emb = (info.embedding_files || []).filter(f => images.includes(f));
                        if (emb.length > 0) embeddingFiles = emb;
                    } catch (_) {}
                }

                const item = {
                    folderName:   entry.name,
                    imageCount:   images.length,
                    previewFiles: embeddingFiles || images.slice(0, 6),
                    flagged:      flagged.has(entry.name),
                };

                if (/^person_\d+$/i.test(entry.name)) {
                    unassigned.push(item);
                } else {
                    assigned.push({ ...item, rollNo: entry.name });
                }
            }

            unassigned.sort((a, b) => a.folderName.localeCompare(b.folderName));

            res.json({ batch, unassigned, assigned });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Serve a photo from any folder (person_XXX or roll-no) ───
    async servePhoto(req, res) {
        try {
            const { batch, folder, filename } = req.params;
            const filePath = path.join(GROUND_TRUTH_DIR, batch, folder, filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Photo not found' });
            }
            res.sendFile(filePath);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Serve an ERP photo ───────────────────────────────────────
    async serveErpPhoto(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(ERP_PHOTOS_DIR, filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'ERP photo not found' });
            }
            res.sendFile(filePath);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Auto-match clusters to ERP photos (SSE stream from Python) ─
    async autoMatch(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }
            if (!fs.existsSync(ERP_PHOTOS_DIR) ||
                fs.readdirSync(ERP_PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length === 0) {
                return res.status(400).json({
                    error: 'No ERP photos found. Upload student photos named {rollNo}.jpg to the erp_photos folder.'
                });
            }

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const response = await axios.post(
                `${ML_SERVICE_URL}/match-clusters-to-erp`,
                { batch_dir: batchPath, erp_photos_dir: ERP_PHOTOS_DIR, top_k: 3 },
                { responseType: 'stream', timeout: 0 }
            );
            response.data.pipe(res);
            response.data.on('end',   () => res.end());
            response.data.on('error', (err) => {
                res.write(`data: ${JSON.stringify({ type: 'error', msg: err.message })}\n\n`);
                res.end();
            });
        } catch (err) {
            console.error('autoMatch error:', err.code, err.response?.data);
            const msg = err.response?.data?.detail || err.message;
            if (!res.headersSent) {
                res.status(500).json({ error: msg });
            } else {
                res.write(`data: ${JSON.stringify({ type: 'error', msg })}\n\n`);
                res.end();
            }
        }
    }

    // ─── Rename person_XXX → rollNo (approve) ────────────────────
    async assignRollNo(req, res) {
        try {
            const { batch, folderName, rollNo } = req.body;
            if (!batch || !folderName || !rollNo) {
                return res.status(400).json({ error: 'batch, folderName, and rollNo are required' });
            }

            const trimmedRoll = rollNo.trim().toUpperCase();
            const batchPath   = path.join(GROUND_TRUTH_DIR, batch);
            const srcPath     = path.join(batchPath, folderName);
            const destPath    = path.join(batchPath, trimmedRoll);

            if (!fs.existsSync(srcPath)) {
                return res.status(404).json({ error: `Folder not found: ${folderName}` });
            }
            if (fs.existsSync(destPath)) {
                return res.status(409).json({
                    error: `Roll number ${trimmedRoll} already exists in this batch`
                });
            }

            await fsPromises.rename(srcPath, destPath);

            // Remove any pending flag for this folder
            const flags = await readFlags(batch);
            await writeFlags(batch, flags.filter(f => f.folderName !== folderName));

            res.json({ message: `Renamed ${folderName} → ${trimmedRoll}`, rollNo: trimmedRoll });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Flag a folder as incorrect match ────────────────────────
    async flagCluster(req, res) {
        try {
            const { batch, folderName, suggestedRollNo, confidence, reason } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }

            const flags = await readFlags(batch);

            // Remove existing flag for this folder, then add new one
            const filtered = flags.filter(f => f.folderName !== folderName);
            filtered.push({
                folderName,
                suggestedRollNo: suggestedRollNo || null,
                confidence:      confidence      || null,
                reason:          reason          || 'operator_rejected',
                flaggedAt:       new Date().toISOString(),
                resolved:        false,
                resolvedRollNo:  null,
            });

            await writeFlags(batch, filtered);
            res.json({ message: `Flagged ${folderName}`, folderName });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── List all flagged clusters for a batch ────────────────────
    async listFlagged(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const flags = await readFlags(batch);
            const open  = flags.filter(f => !f.resolved);

            // Attach preview images for each flagged folder
            const enriched = await Promise.all(open.map(async (flag) => {
                const folderPath = path.join(batchPath, flag.folderName);
                let previewFiles = [];
                if (fs.existsSync(folderPath)) {
                    const files = await fsPromises.readdir(folderPath);
                    previewFiles = files
                        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                        .slice(0, 6);
                }
                return { ...flag, previewFiles };
            }));

            res.json({ batch, flagged: enriched, total: enriched.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Resolve a flagged cluster (manual correct roll no) ───────
    async resolveFlag(req, res) {
        try {
            const { batch, folderName, rollNo } = req.body;
            if (!batch || !folderName || !rollNo) {
                return res.status(400).json({ error: 'batch, folderName, rollNo required' });
            }

            const trimmedRoll = rollNo.trim().toUpperCase();
            const batchPath   = path.join(GROUND_TRUTH_DIR, batch);
            const srcPath     = path.join(batchPath, folderName);
            const destPath    = path.join(batchPath, trimmedRoll);

            if (!fs.existsSync(srcPath)) {
                return res.status(404).json({ error: `Folder not found: ${folderName}` });
            }
            if (fs.existsSync(destPath)) {
                return res.status(409).json({
                    error: `Roll number ${trimmedRoll} already exists`
                });
            }

            await fsPromises.rename(srcPath, destPath);

            // Mark flag as resolved
            const flags = await readFlags(batch);
            const updated = flags.map(f =>
                f.folderName === folderName
                    ? { ...f, resolved: true, resolvedRollNo: trimmedRoll,
                              resolvedAt: new Date().toISOString() }
                    : f
            );
            await writeFlags(batch, updated);

            res.json({ message: `Resolved: ${folderName} → ${trimmedRoll}`, rollNo: trimmedRoll });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get ground truth images for assigned student ─────────────
    async getStudentGroundTruth(req, res) {
        try {
            const { batch, rollNo } = req.params;
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);
            if (!fs.existsSync(studentDir)) {
                return res.status(404).json({ error: 'Student folder not found' });
            }

            const files     = await fsPromises.readdir(studentDir);
            const allImages = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

            const infoPath = path.join(studentDir, '_info.json');
            let embeddingFiles = [];
            let backupFiles    = [];
            let scores         = {};

            if (fs.existsSync(infoPath)) {
                const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                embeddingFiles = (info.embedding_files || []).filter(f => allImages.includes(f));
                backupFiles    = (info.backup_files    || []).filter(f => allImages.includes(f));
                scores         = info.scores || {};
            }

            const tracked   = new Set([...embeddingFiles, ...backupFiles]);
            const untracked = allImages.filter(f => !tracked.has(f));

            const makeList = (fnames) => fnames.map(f => ({
                filename: f,
                url: `/attendancemodule/roll-assign/photo/${batch}/${rollNo}/${f}`,
                score: scores[f] || null,
            }));

            res.json({
                batch,
                rollNo,
                embeddingFiles: makeList(embeddingFiles),
                backupFiles:    makeList(backupFiles),
                untrackedFiles: makeList(untracked),
                totalImages:    allImages.length,
                hasInfo:        embeddingFiles.length > 0 || backupFiles.length > 0,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Bulk assign ──────────────────────────────────────────────
    async bulkAssign(req, res) {
        try {
            const { batch, assignments } = req.body;
            if (!batch || !Array.isArray(assignments)) {
                return res.status(400).json({ error: 'batch and assignments array required' });
            }

            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            const results   = [];

            for (const { folderName, rollNo } of assignments) {
                if (!folderName || !rollNo) {
                    results.push({ folderName, status: 'skipped', reason: 'missing rollNo' });
                    continue;
                }
                const trimmedRoll = rollNo.trim().toUpperCase();
                const srcPath     = path.join(batchPath, folderName);
                const destPath    = path.join(batchPath, trimmedRoll);

                if (!fs.existsSync(srcPath)) {
                    results.push({ folderName, status: 'error', reason: 'folder not found' });
                    continue;
                }
                if (fs.existsSync(destPath)) {
                    results.push({ folderName, status: 'error', reason: `${trimmedRoll} already exists` });
                    continue;
                }
                try {
                    await fsPromises.rename(srcPath, destPath);
                    results.push({ folderName, rollNo: trimmedRoll, status: 'assigned' });
                } catch (e) {
                    results.push({ folderName, status: 'error', reason: e.message });
                }
            }

            // Clear resolved flags
            const assignedNames = results.filter(r => r.status === 'assigned').map(r => r.folderName);
            if (assignedNames.length > 0) {
                const flags = await readFlags(batch);
                await writeFlags(batch, flags.filter(f => !assignedNames.includes(f.folderName)));
            }

            const assigned = results.filter(r => r.status === 'assigned').length;
            res.json({ batch, results, assigned, total: results.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = RollAssignController;

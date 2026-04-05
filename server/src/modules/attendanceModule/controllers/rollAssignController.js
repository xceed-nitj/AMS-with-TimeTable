// server/src/modules/attendanceModule/controllers/rollAssignController.js

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const axios      = require('axios');

const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ground_truth');
const ERP_PHOTOS_DIR   = process.env.ERP_PHOTOS_DIR ||
                          path.join(__dirname, '..', '..', '..', '..', 'erp_photos');

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(GROUND_TRUTH_DIR);
ensureDir(ERP_PHOTOS_DIR);

// ── Flags stored per batch ────────────────────────────────────────
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

// ── Copy image files from src → dest ─────────────────────────────
async function copyImages(srcDir, destDir) {
    await fsPromises.mkdir(destDir, { recursive: true });
    const files  = await fsPromises.readdir(srcDir);
    const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    await Promise.all(
        images.map(f =>
            fsPromises.copyFile(path.join(srcDir, f), path.join(destDir, f))
        )
    );
    return images;
}

// ── Read image + embedding files for a folder ─────────────────────
async function readFolderFiles(folderPath) {
    if (!fs.existsSync(folderPath)) return { imageFiles: [], embeddingFiles: [] };

    const files      = await fsPromises.readdir(folderPath);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

    let embeddingFiles = [];
    const infoPath = path.join(folderPath, '_info.json');
    if (fs.existsSync(infoPath)) {
        try {
            const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
            embeddingFiles = (info.embedding_files || []).filter(f => imageFiles.includes(f));
        } catch (_) {}
    }
    if (!embeddingFiles.length) embeddingFiles = imageFiles.slice(0, 10);

    return { imageFiles, embeddingFiles };
}

class RollAssignController {

    // ─── List unprocessed filesystem clusters (no DB record yet) ──
    async listClusters(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            // Find which person_XXX folders are already tracked in DB
            const dbRecords  = await ClusterMatch.find({ batch }).lean();
            const trackedSet = new Set(dbRecords.map(r => r.folderName));

            const entries = await fsPromises.readdir(batchPath, { withFileTypes: true });
            const unprocessed = [];

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                if (!(/^person_\d+$/i.test(entry.name))) continue; // only person_XXX
                if (trackedSet.has(entry.name)) continue;          // already in DB

                const folderPath = path.join(batchPath, entry.name);
                const files      = await fsPromises.readdir(folderPath);
                const images     = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

                unprocessed.push({
                    folderName:   entry.name,
                    currentFolder: entry.name,
                    imageCount:   images.length,
                    previewFiles: images.slice(0, 6),
                });
            }

            unprocessed.sort((a, b) => a.folderName.localeCompare(b.folderName));
            res.json({ batch, unprocessed });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Auto-assign all matched clusters immediately after ERP match ──
    // For each cluster: rename person_XXX → rollNo (best match), save to DB with approved=false.
    // Unmatched clusters (no face detected) keep their folder and get status=unmatched.
    async autoAssignAll(req, res) {
        try {
            const { batch, matches } = req.body;
            if (!batch || !matches || typeof matches !== 'object') {
                return res.status(400).json({ error: 'batch and matches required' });
            }

            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            let renamed = 0, unmatched = 0, conflicts = 0;

            await Promise.all(
                Object.entries(matches).map(async ([folderName, matchData]) => {
                    const srcPath = path.join(batchPath, folderName);
                    const { imageFiles, embeddingFiles } = await readFolderFiles(srcPath);

                    // ── No face detected — save unmatched, keep folder ────
                    if (matchData.error || !matchData.best) {
                        await ClusterMatch.findOneAndUpdate(
                            { batch, folderName },
                            {
                                $set: {
                                    currentFolder:  folderName,
                                    rollNo:         null,
                                    status:         'unmatched',
                                    approved:       false,
                                    erpPhoto:       null,
                                    confidence:     null,
                                    candidates:     [],
                                    imageFiles,
                                    embeddingFiles,
                                    previewFiles:   matchData.preview_images || imageFiles.slice(0, 6),
                                    imageCount:     matchData.image_count    || imageFiles.length,
                                    error:          matchData.error          || 'no match',
                                    updated_at:     new Date(),
                                },
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        unmatched++;
                        return;
                    }

                    // ── Has a best match — rename folder to rollNo ────────
                    const suggestedRollNo = matchData.best.rollNo.trim().toUpperCase();
                    const destPath        = path.join(batchPath, suggestedRollNo);

                    let actualFolder = suggestedRollNo;
                    let copiedFiles  = imageFiles;

                    if (fs.existsSync(srcPath)) {
                        if (fs.existsSync(destPath)) {
                            // Conflict: rollNo folder already exists — keep person_XXX, flag conflict
                            await ClusterMatch.findOneAndUpdate(
                                { batch, folderName },
                                {
                                    $set: {
                                        currentFolder: folderName,
                                        rollNo:        suggestedRollNo,
                                        status:        'unmatched',
                                        approved:      false,
                                        erpPhoto:      matchData.best.erpPhoto,
                                        confidence:    matchData.best.confidence,
                                        candidates:    matchData.candidates   || [],
                                        imageFiles,
                                        embeddingFiles,
                                        previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                                        imageCount:    matchData.image_count    || imageFiles.length,
                                        error:         `Conflict: folder ${suggestedRollNo} already exists`,
                                        updated_at:    new Date(),
                                    },
                                },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            );
                            conflicts++;
                            return;
                        }

                        // Copy images to rollNo folder, delete person_XXX
                        copiedFiles  = await copyImages(srcPath, destPath);
                        await fsPromises.rm(srcPath, { recursive: true, force: true });
                    }

                    await ClusterMatch.findOneAndUpdate(
                        { batch, folderName },
                        {
                            $set: {
                                currentFolder: actualFolder,
                                rollNo:        suggestedRollNo,
                                status:        'matched',
                                approved:      false,
                                erpPhoto:      matchData.best.erpPhoto,
                                confidence:    matchData.best.confidence,
                                candidates:    matchData.candidates   || [],
                                imageFiles:    copiedFiles,
                                embeddingFiles,
                                previewFiles:  matchData.preview_images || copiedFiles.slice(0, 6),
                                imageCount:    matchData.image_count    || copiedFiles.length,
                                error:         null,
                                updated_at:    new Date(),
                            },
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    renamed++;
                })
            );

            res.json({ renamed, unmatched, conflicts, total: Object.keys(matches).length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get all DB match records for a batch ─────────────────────
    async getMatches(req, res) {
        try {
            const { batch } = req.params;
            const records   = await ClusterMatch.find({ batch }).lean();

            // Build matchMap keyed by folderName for the frontend
            const matchMap = {};
            records.forEach(r => {
                matchMap[r.folderName] = {
                    folderName:    r.folderName,
                    currentFolder: r.currentFolder || r.folderName,
                    rollNo:        r.rollNo,
                    status:        r.status,
                    approved:      r.approved,
                    erpPhoto:      r.erpPhoto,
                    confidence:    r.confidence,
                    candidates:    r.candidates   || [],
                    imageFiles:    r.imageFiles   || [],
                    embeddingFiles: r.embeddingFiles || [],
                    previewFiles:  r.previewFiles  || [],
                    imageCount:    r.imageCount    || 0,
                    error:         r.error         || null,
                };
            });

            res.json({ batch, matchMap, total: records.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Approve a match (operator confirms ERP suggestion) ───────
    // If rollNo matches current folder → just set approved=true (no file ops).
    // If operator overrides rollNo → rename current folder to new rollNo, then approve.
    async approve(req, res) {
        try {
            const { batch, folderName, rollNo: overrideRollNo } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }

            const record = await ClusterMatch.findOne({ batch, folderName });
            if (!record) {
                return res.status(404).json({ error: 'No match record found for this cluster' });
            }

            const currentFolder = record.currentFolder || record.folderName;
            const finalRollNo   = overrideRollNo
                ? overrideRollNo.trim().toUpperCase()
                : record.rollNo;

            if (!finalRollNo) {
                return res.status(400).json({ error: 'No roll number available — provide rollNo in body' });
            }

            let imageFiles = record.imageFiles;

            // Rename only when override differs from current folder name
            if (finalRollNo !== currentFolder) {
                const batchPath = path.join(GROUND_TRUTH_DIR, batch);
                const srcPath   = path.join(batchPath, currentFolder);
                const destPath  = path.join(batchPath, finalRollNo);

                if (fs.existsSync(srcPath)) {
                    if (fs.existsSync(destPath)) {
                        return res.status(409).json({
                            error: `Folder ${finalRollNo} already exists in this batch`,
                        });
                    }
                    imageFiles = await copyImages(srcPath, destPath);
                    await fsPromises.rm(srcPath, { recursive: true, force: true });
                }
            }

            await ClusterMatch.findOneAndUpdate(
                { batch, folderName },
                {
                    $set: {
                        currentFolder: finalRollNo,
                        rollNo:        finalRollNo,
                        status:        'approved',
                        approved:      true,
                        imageFiles,
                        updated_at:    new Date(),
                    },
                }
            );

            // Clear any pending flag for this cluster
            const flags = await readFlags(batch);
            await writeFlags(batch, flags.filter(f => f.folderName !== folderName));

            res.json({ approved: true, rollNo: finalRollNo, folderName });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Serve a photo from any folder ───────────────────────────
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

    // ─── Auto-match clusters to ERP photos (SSE stream) ──────────
    async autoMatch(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }
            const erpFiles = fs.existsSync(ERP_PHOTOS_DIR)
                ? fs.readdirSync(ERP_PHOTOS_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                : [];
            if (!erpFiles.length) {
                return res.status(400).json({
                    error: 'No ERP photos found. Upload student photos named {rollNo}.jpg to the erp_photos folder.',
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
            const msg = err.response?.data?.detail || err.message;
            if (!res.headersSent) res.status(500).json({ error: msg });
            else { res.write(`data: ${JSON.stringify({ type: 'error', msg })}\n\n`); res.end(); }
        }
    }

    // ─── Flag a cluster as incorrect ─────────────────────────────
    async flagCluster(req, res) {
        try {
            const { batch, folderName, suggestedRollNo, confidence, reason } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }

            await ClusterMatch.findOneAndUpdate(
                { batch, folderName },
                { $set: { status: 'flagged', approved: false, updated_at: new Date() } },
                { upsert: false }
            );

            const flags    = await readFlags(batch);
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

    // ─── List all flagged clusters ────────────────────────────────
    async listFlagged(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const flags = await readFlags(batch);
            const open  = flags.filter(f => !f.resolved);

            const enriched = await Promise.all(open.map(async (flag) => {
                // After auto-assign the folder is named rollNo, not person_XXX
                const dbRecord = await ClusterMatch.findOne({ batch, folderName: flag.folderName }).lean();
                const folder   = dbRecord?.currentFolder || flag.folderName;
                const folderPath = path.join(batchPath, folder);

                let previewFiles = [];
                if (fs.existsSync(folderPath)) {
                    const files = await fsPromises.readdir(folderPath);
                    previewFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0, 6);
                } else if (dbRecord?.previewFiles?.length) {
                    previewFiles = dbRecord.previewFiles;
                }
                return { ...flag, currentFolder: folder, previewFiles };
            }));

            res.json({ batch, flagged: enriched, total: enriched.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Resolve a flagged cluster with correct rollNo ────────────
    async resolveFlag(req, res) {
        try {
            const { batch, folderName, rollNo } = req.body;
            if (!batch || !folderName || !rollNo) {
                return res.status(400).json({ error: 'batch, folderName, rollNo required' });
            }

            // Delegate to approve (handles rename if needed)
            req.body.overrideRollNo = rollNo;
            return this.approve(req, res);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get ground truth images for an approved student ─────────
    async getStudentGroundTruth(req, res) {
        try {
            const { batch, rollNo } = req.params;

            // Prefer DB record (has embeddingFiles)
            const dbRecord   = await ClusterMatch.findOne({ batch, rollNo }).lean();
            const studentDir = path.join(GROUND_TRUTH_DIR, batch, rollNo);

            if (!fs.existsSync(studentDir)) {
                return res.status(404).json({ error: 'Student folder not found' });
            }

            const files     = await fsPromises.readdir(studentDir);
            const allImages = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

            let embeddingFiles = [];
            let backupFiles    = [];

            if (dbRecord?.embeddingFiles?.length) {
                embeddingFiles = dbRecord.embeddingFiles.filter(f => allImages.includes(f));
                const embSet   = new Set(embeddingFiles);
                backupFiles    = allImages.filter(f => !embSet.has(f));
            } else {
                const infoPath = path.join(studentDir, '_info.json');
                if (fs.existsSync(infoPath)) {
                    try {
                        const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                        embeddingFiles = (info.embedding_files || []).filter(f => allImages.includes(f));
                        backupFiles    = (info.backup_files    || []).filter(f => allImages.includes(f));
                    } catch (_) {}
                }
                if (!embeddingFiles.length) {
                    embeddingFiles = allImages.slice(0, 10);
                    backupFiles    = allImages.slice(10);
                }
            }

            const tracked   = new Set([...embeddingFiles, ...backupFiles]);
            const untracked = allImages.filter(f => !tracked.has(f));

            const makeList = (fnames) => fnames.map(f => ({
                filename: f,
                url: `/attendancemodule/roll-assign/photo/${batch}/${rollNo}/${f}`,
                score: null,
            }));

            res.json({
                batch, rollNo,
                embeddingFiles: makeList(embeddingFiles),
                backupFiles:    makeList(backupFiles),
                untrackedFiles: makeList(untracked),
                totalImages:    allImages.length,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Bulk approve ─────────────────────────────────────────────
    async bulkAssign(req, res) {
        try {
            const { batch, assignments } = req.body;
            if (!batch || !Array.isArray(assignments)) {
                return res.status(400).json({ error: 'batch and assignments array required' });
            }

            const results = [];
            for (const { folderName, rollNo } of assignments) {
                if (!folderName || !rollNo) {
                    results.push({ folderName, status: 'skipped', reason: 'missing rollNo' });
                    continue;
                }
                try {
                    // Reuse approve logic via a synthetic request
                    const fakeReq = { body: { batch, folderName, rollNo } };
                    let result;
                    const fakeRes = {
                        status: () => ({ json: (d) => { result = { ...d, status: 'error' }; } }),
                        json:   (d) => { result = { ...d, status: 'approved' }; },
                    };
                    await this.approve(fakeReq, fakeRes);
                    results.push(result || { folderName, rollNo, status: 'approved' });
                } catch (e) {
                    results.push({ folderName, status: 'error', reason: e.message });
                }
            }

            const approved = results.filter(r => r.status === 'approved').length;
            res.json({ batch, results, approved, total: results.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = RollAssignController;

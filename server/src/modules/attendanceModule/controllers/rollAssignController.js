// server/src/modules/attendanceModule/controllers/rollAssignController.js

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const axios      = require('axios');

const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');
const erpSync       = require('./erpEmbeddingSyncHelper');
const { batchBelongsToDepartment } = require('../middleware/attendanceAccess');

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');
const ERP_PHOTOS_DIR   = process.env.ERP_PHOTOS_DIR ||
                          path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'erp_photos');

// Minimum confidence to treat an ERP match as genuine (same dept).
// Below this we fall back to matching against approved ground truth clusters.
const CROSS_DEPT_CONFIDENCE_THRESHOLD = parseFloat(process.env.CROSS_DEPT_CONFIDENCE_THRESHOLD || '0.45');

// Minimum confidence to accept a ground-truth cluster match.
const GT_MATCH_THRESHOLD = parseFloat(process.env.GT_MATCH_THRESHOLD || '0.55');

// ── Match a person_XXX cluster against approved ground-truth folders ────────
// Reads mean_embedding from each approved student's _info.json (no ML call for
// those) and calls the ML service only to get the cluster's own mean embedding.
// Returns { rollNo, confidence } if a match exceeds GT_MATCH_THRESHOLD, else null.
async function matchAgainstGroundTruth(batch, batchPath, folderPath) {
    const ML_SVC = process.env.ML_SERVICE_URL || 'http://localhost:8500';

    // ── Step 1: get the cluster's mean embedding from ML service ────────────
    let clusterEmb;
    try {
        const res = await axios.post(
            `${ML_SVC}/cluster-mean-embedding`,
            { folder_path: folderPath },
            { timeout: 15000 }
        );
        clusterEmb = res.data?.embedding;   // float32 array
    } catch (_) {
        return null;  // ML service unavailable — skip GT matching
    }
    if (!clusterEmb || !clusterEmb.length) return null;

    // ── Step 2: load mean embeddings from every approved GT folder ──────────
    const approvedRecords = await ClusterMatch.find({ batch, approved: true, rollNo: { $ne: null } }).lean();
    if (!approvedRecords.length) return null;

    let bestRoll = null, bestConf = -Infinity;

    for (const rec of approvedRecords) {
        const gtFolder = rec.rollNo;   // approved folder is always named after rollNo
        const infoPath = path.join(batchPath, gtFolder, '_info.json');
        if (!fs.existsSync(infoPath)) continue;

        let gtEmb;
        try {
            const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
            gtEmb = info.mean_embedding;   // cached by update-student-embedding
        } catch (_) { continue; }
        if (!gtEmb || !gtEmb.length) continue;

        // cosine similarity
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < clusterEmb.length; i++) {
            dot   += clusterEmb[i] * gtEmb[i];
            normA += clusterEmb[i] * clusterEmb[i];
            normB += gtEmb[i]       * gtEmb[i];
        }
        const sim = normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;

        if (sim > bestConf) { bestConf = sim; bestRoll = rec.rollNo; }
    }

    if (bestConf >= GT_MATCH_THRESHOLD && bestRoll) {
        return { rollNo: bestRoll, confidence: Math.round(bestConf * 10000) / 10000 };
    }
    return null;
}

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

// ── Copy image files (+ _info.json) from src → dest ──────────────
async function copyImages(srcDir, destDir) {
    await fsPromises.mkdir(destDir, { recursive: true });
    const files  = await fsPromises.readdir(srcDir);
    const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    const toCopy = [...images];
    // Also carry over the metadata file if it exists
    if (files.includes('_info.json')) toCopy.push('_info.json');
    await Promise.all(
        toCopy.map(f =>
            fsPromises.copyFile(path.join(srcDir, f), path.join(destDir, f))
        )
    );
    return images; // only image filenames returned (not _info.json)
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

    // ─── List unprocessed clusters (unmatched, not yet approved) ─────
    async listClusters(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            // Primary: DB records for this batch not yet approved
            const dbRecords  = await ClusterMatch.find({ batch }).lean();
            const trackedSet = new Set(dbRecords.map(r => r.folderName));

            // Backward-compat: pick up person_XXX folders that pre-date the ObjectId change
            const entries = await fsPromises.readdir(batchPath, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                if (!(/^person_\d+$/i.test(entry.name))) continue;
                if (trackedSet.has(entry.name)) continue;

                const folderPath = path.join(batchPath, entry.name);
                const files      = await fsPromises.readdir(folderPath);
                const images     = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

                // Create a ClusterMatch record on-the-fly so it gets an ObjectId
                const doc = await ClusterMatch.findOneAndUpdate(
                    { batch, folderName: entry.name },
                    { $setOnInsert: {
                        batch,
                        folderName:    entry.name,
                        currentFolder: entry.name,
                        status:        'unmatched',
                        imageFiles:    images,
                        imageCount:    images.length,
                        previewFiles:  images.slice(0, 6),
                    }},
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                ).lean();
                dbRecords.push(doc);
                trackedSet.add(entry.name);
            }

            const unprocessed = dbRecords
                .filter(r => !r.approved)
                .map(r => ({
                    _id:           r._id,
                    folderName:    r.folderName,
                    currentFolder: r.currentFolder || r.folderName,
                    imageCount:    r.imageCount    || 0,
                    imageFiles:    r.imageFiles    || [],
                    previewFiles:  r.previewFiles  || [],
                    status:        r.status,
                }))
                .sort((a, b) => a.folderName.localeCompare(b.folderName));

            res.json({ batch, unprocessed });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── List ALL clusters in a batch ─────────────────────────────────
    async listAllClusters(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const dbRecords  = await ClusterMatch.find({ batch }).lean();
            const trackedSet = new Set(dbRecords.map(r => r.folderName));

            // Scan filesystem for any person_XXX without a DB record (backward compat)
            const entries = await fsPromises.readdir(batchPath, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                if (!(/^person_\d+$/i.test(entry.name))) continue;
                if (trackedSet.has(entry.name)) continue;

                const folderPath = path.join(batchPath, entry.name);
                const files      = await fsPromises.readdir(folderPath);
                const images     = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

                const doc = await ClusterMatch.findOneAndUpdate(
                    { batch, folderName: entry.name },
                    { $setOnInsert: {
                        batch, folderName: entry.name, currentFolder: entry.name,
                        status: 'unmatched', imageFiles: images,
                        imageCount: images.length, previewFiles: images.slice(0, 6),
                    }},
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                ).lean();
                dbRecords.push(doc);
                trackedSet.add(entry.name);
            }

            const clusters = await Promise.all(
                dbRecords
                    .filter(r => /^person_\d+$/i.test(r.folderName))
                    .map(async r => {
                        const folder     = r.currentFolder || r.folderName;
                        const folderPath = path.join(batchPath, folder);
                        let imageFiles   = r.imageFiles || [];

                        if (fs.existsSync(folderPath)) {
                            const files  = await fsPromises.readdir(folderPath);
                            const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
                            imageFiles   = await Promise.all(images.map(async img => {
                                let addedAt = null;
                                try {
                                    const st = await fsPromises.stat(path.join(folderPath, img));
                                    addedAt = (st.birthtime?.getTime() > 0 ? st.birthtime : st.mtime).toISOString();
                                } catch (_) {}
                                return { filename: img, addedAt };
                            }));
                        }

                        return {
                            _id:          r._id,
                            folderName:   r.folderName,
                            currentFolder: folder,
                            imageCount:   imageFiles.length,
                            imageFiles,
                        };
                    })
            );

            clusters.sort((a, b) => a.folderName.localeCompare(b.folderName));
            res.json({ batch, clusters });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Delete an entire cluster folder + DB record (by ObjectId) ────
    async deleteCluster(req, res) {
        try {
            const { id } = req.params;
            const record = await ClusterMatch.findById(id).lean();
            if (!record) return res.status(404).json({ error: 'Cluster not found' });

            const folder     = record.currentFolder || record.folderName;
            const folderPath = path.join(GROUND_TRUTH_DIR, record.batch, folder);
            if (fs.existsSync(folderPath)) {
                await fsPromises.rm(folderPath, { recursive: true, force: true });
            }
            await ClusterMatch.deleteOne({ _id: id });
            res.json({ ok: true, deleted: folder });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Delete a single photo from a cluster folder (by ObjectId) ────
    async deleteClusterPhoto(req, res) {
        try {
            const { id, filename } = req.params;
            const record = await ClusterMatch.findById(id).lean();
            if (!record) return res.status(404).json({ error: 'Cluster not found' });

            const folder       = record.currentFolder || record.folderName;
            const safeFilename = path.basename(filename);
            const photoPath    = path.join(GROUND_TRUTH_DIR, record.batch, folder, safeFilename);
            if (fs.existsSync(photoPath)) {
                await fsPromises.unlink(photoPath);
            }
            // Remove from imageFiles list in DB
            await ClusterMatch.findByIdAndUpdate(id, {
                $pull: { imageFiles: safeFilename, embeddingFiles: safeFilename, previewFiles: safeFilename },
                $inc:  { imageCount: -1 },
            });
            res.json({ ok: true, deleted: safeFilename });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Auto-assign all matched clusters immediately after ERP match ──
    // *** CHANGED: No longer renames any folders. ***
    // Saves DB records with currentFolder = original person_XXX name.
    // Folder rename happens only when operator clicks Approve (via approve()).
    async autoAssignAll(req, res) {
        try {
            const { batch, matches } = req.body;
            if (!batch || !matches || typeof matches !== 'object') {
                return res.status(400).json({ error: 'batch and matches required' });
            }

            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            let saved = 0, unmatched = 0, conflicts = 0;

            await Promise.all(
                Object.entries(matches).map(async ([folderName, matchData]) => {
                    const srcPath = path.join(batchPath, folderName);
                    const { imageFiles, embeddingFiles } = await readFolderFiles(srcPath);

                    // ── No face detected OR no ERP match ──────────────────
                    if (matchData.error || !matchData.best) {
                        // Faces were detected but no ERP match at all —
                        // try matching against approved ground truth in this batch.
                        if (!matchData.error && matchData.image_count > 0) {
                            const gtMatch = await matchAgainstGroundTruth(batch, batchPath, srcPath);
                            if (gtMatch) {
                                // GT matched — treat exactly like a normal ERP match
                                await ClusterMatch.findOneAndUpdate(
                                    { batch, folderName },
                                    { $set: {
                                        currentFolder: folderName,
                                        rollNo:        gtMatch.rollNo,
                                        status:        'matched',
                                        approved:      false,
                                        erpPhoto:      null,
                                        confidence:    gtMatch.confidence,
                                        candidates:    [],
                                        imageFiles, embeddingFiles,
                                        previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                                        imageCount:    matchData.image_count    || imageFiles.length,
                                        error:         null,
                                        updated_at:    new Date(),
                                    }},
                                    { upsert: true, new: true, setDefaultsOnInsert: true }
                                );
                                saved++;
                                return;
                            }
                        }
                        // Truly unidentifiable — no ERP, no GT match (or no face at all)
                        const isCrossDept = !matchData.error && matchData.image_count > 0;
                        await ClusterMatch.findOneAndUpdate(
                            { batch, folderName },
                            { $set: {
                                currentFolder: folderName,
                                rollNo:        null,
                                status:        isCrossDept ? 'cross_dept' : 'unmatched',
                                approved:      false,
                                erpPhoto:      null,
                                confidence:    null,
                                candidates:    [],
                                imageFiles, embeddingFiles,
                                previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                                imageCount:    matchData.image_count    || imageFiles.length,
                                error:         matchData.error          || null,
                                updated_at:    new Date(),
                            }},
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        unmatched++;
                        return;
                    }

                    // ── ERP returned a best match — but confidence too low? ─────────────
                    // Fall back to ground truth cluster matching before giving up.
                    if (matchData.best.confidence < CROSS_DEPT_CONFIDENCE_THRESHOLD) {
                        const gtMatch = await matchAgainstGroundTruth(batch, batchPath, srcPath);
                        if (gtMatch) {
                            await ClusterMatch.findOneAndUpdate(
                                { batch, folderName },
                                { $set: {
                                    currentFolder: folderName,
                                    rollNo:        gtMatch.rollNo,
                                    status:        'matched',
                                    approved:      false,
                                    erpPhoto:      null,
                                    confidence:    gtMatch.confidence,
                                    candidates:    matchData.candidates || [],
                                    imageFiles, embeddingFiles,
                                    previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                                    imageCount:    matchData.image_count    || imageFiles.length,
                                    error:         null,
                                    updated_at:    new Date(),
                                }},
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            );
                            saved++;
                            return;
                        }
                        // GT also didn’t match — save as cross_dept
                        await ClusterMatch.findOneAndUpdate(
                            { batch, folderName },
                            { $set: {
                                currentFolder: folderName,
                                rollNo:        null,
                                status:        'cross_dept',
                                approved:      false,
                                erpPhoto:      null,
                                confidence:    matchData.best.confidence,
                                candidates:    matchData.candidates || [],
                                imageFiles, embeddingFiles,
                                previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                                imageCount:    matchData.image_count    || imageFiles.length,
                                error:         null,
                                updated_at:    new Date(),
                            }},
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        unmatched++;
                        return;
                    }

                    // ── Has a best match — save to DB only, folder stays as person_XXX ─
                    const suggestedRollNo = matchData.best.rollNo.trim().toUpperCase();

                    // Check if another cluster is already matched/approved to this rollNo
                    const existingForRoll = await ClusterMatch.findOne({
                        batch,
                        rollNo: suggestedRollNo,
                        folderName: { $ne: folderName },
                        approved: true,
                    }).lean();

                    const status = existingForRoll ? 'matched' : 'matched';
                    // Note: we always use 'matched' here — conflict detection happens
                    // at approve time when the folder rename is actually attempted.

                    await ClusterMatch.findOneAndUpdate(
                        { batch, folderName },
                        {
                            $set: {
                                currentFolder:  folderName,       // stays person_XXX until approved
                                rollNo:         suggestedRollNo,  // suggested only
                                status,
                                approved:       false,
                                erpPhoto:       matchData.best.erpPhoto,
                                confidence:     matchData.best.confidence,
                                candidates:     matchData.candidates  || [],
                                imageFiles,
                                embeddingFiles,
                                previewFiles:   matchData.preview_images || imageFiles.slice(0, 6),
                                imageCount:     matchData.image_count    || imageFiles.length,
                                error:          null,
                                updated_at:     new Date(),
                            },
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    saved++;
                })
            );

            res.json({ renamed: saved, unmatched, conflicts, total: Object.keys(matches).length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }


    async saveMatchResult(req, res) {
        try {
            const { batch, folderName, matchData } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }

            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            const srcPath   = path.join(batchPath, folderName);
            const { imageFiles, embeddingFiles } = await readFolderFiles(srcPath);

            // ── No face detected OR no ERP match ───────────────────
            if (matchData.error || !matchData.best) {
                if (!matchData.error && matchData.image_count > 0) {
                    const gtMatch = await matchAgainstGroundTruth(batch, batchPath, srcPath);
                    if (gtMatch) {
                        await ClusterMatch.findOneAndUpdate(
                            { batch, folderName },
                            { $set: {
                                currentFolder: folderName,
                                rollNo:        gtMatch.rollNo,
                                status:        'matched',
                                approved:      false,
                                erpPhoto:      null,
                                confidence:    gtMatch.confidence,
                                candidates:    [],
                                imageFiles, embeddingFiles,
                                previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                                imageCount:    matchData.image_count    || imageFiles.length,
                                error:         null,
                                updated_at:    new Date(),
                            }},
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        return res.json({ ok: true, status: 'matched', folderName, rollNo: gtMatch.rollNo });
                    }
                }
                const isCrossDept = !matchData.error && matchData.image_count > 0;
                await ClusterMatch.findOneAndUpdate(
                    { batch, folderName },
                    { $set: {
                        currentFolder: folderName,
                        rollNo:        null,
                        status:        isCrossDept ? 'cross_dept' : 'unmatched',
                        approved:      false,
                        erpPhoto:      null,
                        confidence:    null,
                        candidates:    [],
                        imageFiles, embeddingFiles,
                        previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                        imageCount:    matchData.image_count    || imageFiles.length,
                        error:         matchData.error          || null,
                        updated_at:    new Date(),
                    }},
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                return res.json({ ok: true, status: isCrossDept ? 'cross_dept' : 'unmatched', folderName });
            }

            // ── ERP has a best match — but confidence too low? ──────────────────
            // Fall back to ground truth cluster matching before giving up.
            if (matchData.best.confidence < CROSS_DEPT_CONFIDENCE_THRESHOLD) {
                const gtMatch = await matchAgainstGroundTruth(batch, batchPath, srcPath);
                if (gtMatch) {
                    await ClusterMatch.findOneAndUpdate(
                        { batch, folderName },
                        { $set: {
                            currentFolder: folderName,
                            rollNo:        gtMatch.rollNo,
                            status:        'matched',
                            approved:      false,
                            erpPhoto:      null,
                            confidence:    gtMatch.confidence,
                            candidates:    matchData.candidates || [],
                            imageFiles, embeddingFiles,
                            previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                            imageCount:    matchData.image_count    || imageFiles.length,
                            error:         null,
                            updated_at:    new Date(),
                        }},
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    return res.json({ ok: true, status: 'matched', folderName, rollNo: gtMatch.rollNo });
                }
                // GT also didn’t match — cross_dept
                await ClusterMatch.findOneAndUpdate(
                    { batch, folderName },
                    { $set: {
                        currentFolder: folderName,
                        rollNo:        null,
                        status:        'cross_dept',
                        approved:      false,
                        erpPhoto:      null,
                        confidence:    matchData.best.confidence,
                        candidates:    matchData.candidates || [],
                        imageFiles, embeddingFiles,
                        previewFiles:  matchData.preview_images || imageFiles.slice(0, 6),
                        imageCount:    matchData.image_count    || imageFiles.length,
                        error:         null,
                        updated_at:    new Date(),
                    }},
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                return res.json({ ok: true, status: 'cross_dept', folderName });
            }

            // ── Has a best match — save with matched status, folder stays person_XXX ─
            const suggestedRollNo = matchData.best.rollNo.trim().toUpperCase();

            await ClusterMatch.findOneAndUpdate(
                { batch, folderName },
                {
                    $set: {
                        currentFolder:  folderName,           // stays person_XXX until approved
                        rollNo:         suggestedRollNo,
                        status:         'matched',
                        approved:       false,
                        erpPhoto:       matchData.best.erpPhoto,
                        confidence:     matchData.best.confidence,
                        candidates:     matchData.candidates  || [],
                        imageFiles,
                        embeddingFiles,
                        previewFiles:   matchData.preview_images || imageFiles.slice(0, 6),
                        imageCount:     matchData.image_count    || imageFiles.length,
                        error:          null,
                        updated_at:     new Date(),
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            res.json({ ok: true, status: 'matched', folderName, rollNo: suggestedRollNo });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get all DB match records for a batch ─────────────────────
    async getMatches(req, res) {
        try {
            const { batch } = req.params;
            const records   = await ClusterMatch.find({ batch }).lean();

            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            const matchMap  = {};
            const repairs   = [];

            for (const r of records) {
                let currentFolder = r.currentFolder || r.folderName;

                // ── Self-healing: folder was already renamed but DB wasn't updated ──
                // Only applies to approved records where currentFolder should be rollNo.
                if (
                    r.approved &&
                    r.rollNo &&
                    currentFolder !== r.rollNo &&
                    !fs.existsSync(path.join(batchPath, currentFolder)) &&
                    fs.existsSync(path.join(batchPath, r.rollNo))
                ) {
                    currentFolder = r.rollNo;
                    const destData = await readFolderFiles(path.join(batchPath, r.rollNo));
                    repairs.push(
                        ClusterMatch.findOneAndUpdate(
                            { batch, folderName: r.folderName },
                            {
                                $set: {
                                    currentFolder:  r.rollNo,
                                    imageFiles:     destData.imageFiles,
                                    embeddingFiles: destData.embeddingFiles,
                                    previewFiles:   destData.imageFiles.slice(0, 6),
                                    imageCount:     destData.imageFiles.length,
                                    updated_at:     new Date(),
                                },
                            },
                            { new: true }
                        )
                    );
                }

                matchMap[r.folderName] = {
                    _id:           r._id,          // stable ObjectId — use for all mutations
                    folderName:    r.folderName,
                    currentFolder,
                    rollNo:        r.rollNo,
                    status:        r.status,
                    approved:      r.approved,
                    erpPhoto:      r.erpPhoto,
                    confidence:    r.confidence,
                    candidates:    r.candidates    || [],
                    imageFiles:    r.imageFiles    || [],
                    embeddingFiles: r.embeddingFiles || [],
                    previewFiles:  r.previewFiles  || [],
                    imageCount:    r.imageCount    || 0,
                    error:         r.error         || null,
                };
            }

            // Fire-and-forget DB repairs
            if (repairs.length) Promise.all(repairs).catch(() => {});

            res.json({ batch, matchMap, total: records.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Approve a match — folder rename person_XXX → rollNo happens here ──
    // Accepts { id } (ObjectId) — no longer needs batch/folderName from caller.
    async approve(req, res) {
        try {
            const { id, rollNo: overrideRollNo } = req.body;
            if (!id) return res.status(400).json({ error: 'id (ObjectId) required' });

            let record = await ClusterMatch.findById(id);
            if (!record) return res.status(404).json({ error: 'Cluster not found' });

            const { batch, folderName } = record;
            const finalRollNo = overrideRollNo
                ? overrideRollNo.trim().toUpperCase()
                : record.rollNo || null;

            if (!finalRollNo) {
                return res.status(400).json({ error: 'No roll number available — provide rollNo in body' });
            }

            if (!record) {
                record = { batch, folderName, currentFolder: folderName, rollNo: finalRollNo,
                           imageFiles: [], embeddingFiles: [] };
            }

            const currentFolder    = record.currentFolder || record.folderName;
            let   imageFiles       = [...(record.imageFiles || [])];
            let   mergedIntoExisting = false;

            // ── File operations: rename person_XXX → rollNo ───────────
            if (finalRollNo !== currentFolder) {
                const batchPath = path.join(GROUND_TRUTH_DIR, batch);
                const srcPath   = path.join(batchPath, currentFolder);
                const destPath  = path.join(batchPath, finalRollNo);

                if (fs.existsSync(srcPath)) {
                    if (fs.existsSync(destPath)) {
                        // Merge: rollNo folder already exists (another student approved earlier)
                        const srcFiles  = await fsPromises.readdir(srcPath);
                        const srcImages = srcFiles.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                        const prefix    = `new_${Date.now()}_`;
                        imageFiles = [];
                        for (const img of srcImages) {
                            const newName = prefix + img;
                            await fsPromises.copyFile(
                                path.join(srcPath, img),
                                path.join(destPath, newName)
                            );
                            imageFiles.push(newName);
                        }
                        await fsPromises.rm(srcPath, { recursive: true, force: true });
                        mergedIntoExisting = true;
                    } else {
                        // Simple rename: copy all files + _info.json, delete src
                        imageFiles = await copyImages(srcPath, destPath);
                        await fsPromises.rm(srcPath, { recursive: true, force: true });
                    }
                }
            }

            // ── Update _info.json in the final folder ─────────────────
            const EMBED_N    = 5;
            const folderPath = path.join(GROUND_TRUTH_DIR, batch, finalRollNo);
            const infoPath   = path.join(folderPath, '_info.json');

            if (fs.existsSync(folderPath)) {
                const dirFiles = await fsPromises.readdir(folderPath);
                const allFiles = dirFiles.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

                let info = { embedding_files: [], backup_files: [], approved_files: [], scores: {} };
                if (fs.existsSync(infoPath)) {
                    try { info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8')); } catch (_) {}
                }

                if (mergedIntoExisting) {
                    const approvedSet = new Set(info.approved_files || []);
                    imageFiles.forEach(f => approvedSet.add(f));
                    info.approved_files = [...approvedSet];

                    const existingEmbeds  = (info.embedding_files || []).filter(f => allFiles.includes(f));
                    const existingBackups = (info.backup_files    || []).filter(f => allFiles.includes(f));
                    const embedSlots      = EMBED_N - existingEmbeds.length;

                    if (embedSlots > 0) {
                        const addToEmbed  = imageFiles.slice(0, embedSlots);
                        const addToBackup = imageFiles.slice(embedSlots);
                        info.embedding_files = [...existingEmbeds, ...addToEmbed];
                        info.backup_files    = [...existingBackups, ...addToBackup];
                    } else {
                        info.backup_files = [...existingBackups, ...imageFiles];
                    }
                } else {
                    if (!info.embedding_files?.length) {
                        const dbEmbeds = (record.embeddingFiles || []).filter(f => allFiles.includes(f));
                        info.embedding_files = dbEmbeds.length > 0 ? dbEmbeds
                            : allFiles.length <= EMBED_N ? [...allFiles] : allFiles.slice(0, EMBED_N);
                        info.backup_files = allFiles.filter(f => !info.embedding_files.includes(f));
                    }
                    if (!info.approved_files?.length) {
                        info.approved_files = [...allFiles];
                    }
                }

                await fsPromises.writeFile(infoPath, JSON.stringify(info, null, 2));
            }
            // ── Update DB record by ObjectId ──────────────────────────
            if (mergedIntoExisting) {
                await ClusterMatch.findByIdAndDelete(id);
                const allFinalFiles = fs.existsSync(folderPath) ? (await fsPromises.readdir(folderPath)).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort() : [];
                await ClusterMatch.findOneAndUpdate(
                    { batch, currentFolder: finalRollNo },
                    {
                        $set: {
                            rollNo:        finalRollNo,
                            status:        'approved',
                            approved:      true,
                            imageFiles:    allFinalFiles,
                            imageCount:    allFinalFiles.length,
                            previewFiles:  allFinalFiles.slice(0, 6),
                            updated_at:    new Date(),
                        }
                    },
                    { upsert: true }
                );
            } else {
                await ClusterMatch.findByIdAndUpdate(id, {
                    $set: {
                        currentFolder: finalRollNo,
                        rollNo:        finalRollNo,
                        status:        'approved',
                        approved:      true,
                        imageFiles,
                        updated_at:    new Date(),
                    },
                });
            }

            // Clear any pending flag for this cluster
            const flags = await readFlags(batch);
            await writeFlags(batch, flags.filter(f => f.folderName !== folderName));

            res.json({ approved: true, rollNo: finalRollNo, folderName, id });
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
            const { batch, filename } = req.params;
            const safeFilename = path.basename(filename);
            const safeBatch    = batch ? path.basename(batch) : null;

            // 1. batch-specific subfolder: erp_photos/<batch>/<filename>
            if (safeBatch) {
                const batchPath = path.join(ERP_PHOTOS_DIR, safeBatch, safeFilename);
                if (fs.existsSync(batchPath)) return res.sendFile(batchPath);
            }

            // 2. flat root: erp_photos/<filename>
            const flatPath = path.join(ERP_PHOTOS_DIR, safeFilename);
            if (fs.existsSync(flatPath)) return res.sendFile(flatPath);

            // 3. search every subdirectory inside erp_photos/
            if (fs.existsSync(ERP_PHOTOS_DIR)) {
                const dirs = fs.readdirSync(ERP_PHOTOS_DIR, { withFileTypes: true })
                    .filter(e => e.isDirectory()).map(e => e.name);
                for (const dir of dirs) {
                    const p = path.join(ERP_PHOTOS_DIR, dir, safeFilename);
                    if (fs.existsSync(p)) return res.sendFile(p);
                }
            }

            res.status(404).json({ error: 'ERP photo not found' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── ERP embedding status (available + student count) ────────
    async erpEmbeddingStatus(req, res) {
        try {
            const { batch }  = req.params;
            const parts      = batch.split('_');
            const department = parts.slice(1, -1).join('_');

            let pkgCheck = { available: false };
            try {
                pkgCheck = await erpSync.checkErpEmbedding(batch, department);
            } catch (_) {}

            // Count ERP photos as proxy for student count when ML doesn't provide it
            const batchPhotoDir = path.join(ERP_PHOTOS_DIR, batch);
            let studentCount = pkgCheck.student_count || pkgCheck.num_students || pkgCheck.count || 0;
            if (!studentCount && fs.existsSync(batchPhotoDir)) {
                try {
                    studentCount = fs.readdirSync(batchPhotoDir)
                        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
                } catch (_) {}
            }

            res.json({
                available:    !!pkgCheck.available,
                pklName:      pkgCheck.pkl_path ? path.basename(pkgCheck.pkl_path) : null,
                studentCount,
            });
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

            const parts      = batch.split('_');
            const department = parts.slice(1, -1).join('_');

            const ERP_PHOTOS_BASE = ERP_PHOTOS_DIR;
            const batchPhotoDir   = path.join(ERP_PHOTOS_BASE, batch);
            const erpPhotosDir    = fs.existsSync(batchPhotoDir) ? batchPhotoDir : ERP_PHOTOS_BASE;

            // ── Check for pre-built pkl ───────────────────────────────────
            let pkgCheck = { available: false };
            try {
                pkgCheck = await erpSync.checkErpEmbedding(batch, department);
            } catch (_) {}

            // Require pre-built pkl — block before starting SSE stream
            if (!pkgCheck.available) {
                return res.status(422).json({ noEmbedding: true, batch, department });
            }

            const pklData = erpSync.readPklBase64(pkgCheck.pkl_path);

            // ── Build ERP photo filename map (mirrors the old Python 3-tier
            // search: batch-specific dir, parent erp_photos/ root, siblings) ──
            const erpPhotoMap = {};
            const searchDirs = [erpPhotosDir];
            const parentDir = path.dirname(erpPhotosDir);
            if (fs.existsSync(parentDir) && parentDir !== erpPhotosDir) {
                searchDirs.push(parentDir);
                try {
                    for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
                        if (entry.isDirectory()) {
                            const sibling = path.join(parentDir, entry.name);
                            if (!searchDirs.includes(sibling)) searchDirs.push(sibling);
                        }
                    }
                } catch (_) {}
            }
            for (const dir of searchDirs) {
                if (!fs.existsSync(dir)) continue;
                for (const fname of fs.readdirSync(dir)) {
                    if (/\.(jpg|jpeg|png|webp)$/i.test(fname)) {
                        const rn = path.basename(fname, path.extname(fname)).toUpperCase();
                        if (!(rn in erpPhotoMap)) erpPhotoMap[rn] = fname;
                    }
                }
            }

            // ── Build cluster photo payload (person_XXX folders) ──────────
            const clusterDirs = fs.readdirSync(batchPath, { withFileTypes: true })
                .filter(e => e.isDirectory() && /^person_\d+$/i.test(e.name))
                .map(e => e.name)
                .sort();

            const clusters = clusterDirs.map(folderName => {
                const folderPath = path.join(batchPath, folderName);
                const imgFiles = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                const photos = imgFiles.map(filename => ({
                    filename,
                    data: fs.readFileSync(path.join(folderPath, filename)).toString('base64'),
                }));
                return { folder_name: folderName, photos };
            });

            res.setHeader('Content-Type',  'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection',    'keep-alive');
            res.flushHeaders();

            const mlResponse = await axios.post(
                `${ML_SERVICE_URL}/match-clusters-to-erp-fast`,
                { pkl_data: pklData, erp_photo_map: erpPhotoMap, clusters, top_k: 3 },
                { responseType: 'stream', timeout: 0 }
            );

            mlResponse.data.pipe(res);
            mlResponse.data.on('end',   () => res.end());
            mlResponse.data.on('error', (err) => {
                if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ type: 'error', msg: err.message })}\n\n`);
                    res.end();
                }
            });

        } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            if (!res.headersSent) res.status(500).json({ error: msg });
            else {
                res.write(`data: ${JSON.stringify({ type: 'error', msg })}\n\n`);
                res.end();
            }
        }
    }

    // ─── Flag a cluster as incorrect (by ObjectId) ───────────────
    async flagCluster(req, res) {
        try {
            const { id, suggestedRollNo, confidence, reason } = req.body;
            if (!id) return res.status(400).json({ error: 'id (ObjectId) required' });

            const record = await ClusterMatch.findByIdAndUpdate(
                id,
                { $set: { status: 'flagged', approved: false, updated_at: new Date() } },
                { new: true }
            ).lean();
            if (!record) return res.status(404).json({ error: 'Cluster not found' });

            const { batch, folderName } = record;
            const flags    = await readFlags(batch);
            const filtered = flags.filter(f => f.folderName !== folderName);
            filtered.push({
                id,
                folderName,
                suggestedRollNo: suggestedRollNo || null,
                confidence:      confidence      || null,
                reason:          reason          || 'operator_rejected',
                flaggedAt:       new Date().toISOString(),
                resolved:        false,
                resolvedRollNo:  null,
            });
            await writeFlags(batch, filtered);

            res.json({ message: `Flagged ${folderName}`, folderName, id });
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

    // ─── Resolve a flagged cluster with correct rollNo (by ObjectId) ─
    async resolveFlag(req, res) {
        try {
            const { id, rollNo } = req.body;
            if (!id || !rollNo) {
                return res.status(400).json({ error: 'id (ObjectId) and rollNo required' });
            }
            // Reuse approve — it already accepts { id, rollNo }
            req.body.rollNo = rollNo;
            return this.approve(req, res);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get ground truth images for an approved student ─────────
    async getStudentGroundTruth(req, res) {
        try {
            const { batch, rollNo } = req.params;

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
            for (const { id, folderName, rollNo } of assignments) {
                const clusterId = id || null;
                if ((!clusterId && !folderName) || !rollNo) {
                    results.push({ folderName, status: 'skipped', reason: 'missing id/rollNo' });
                    continue;
                }
                // Resolve id from folderName if not provided (backward compat)
                let resolvedId = clusterId;
                if (!resolvedId && folderName) {
                    const rec = await ClusterMatch.findOne({ batch, folderName }).lean();
                    resolvedId = rec?._id?.toString();
                }
                if (!resolvedId) {
                    results.push({ folderName, status: 'skipped', reason: 'cluster not found' });
                    continue;
                }
                try {
                    const fakeReq = { body: { id: resolvedId, rollNo } };
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

    async getSummary(req, res) {
        const agg = await ClusterMatch.aggregate([
            { $group: {
                _id:        '$batch',
                total:      { $sum: 1 },
                approved:   { $sum: { $cond: [{ $eq: ['$approved', true] }, 1, 0] } },
                pending:    { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'matched'] }, { $eq: ['$approved', false] }] }, 1, 0] } },
                flagged:    { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } },
                unmatched:  { $sum: { $cond: [{ $eq: ['$status', 'unmatched'] }, 1, 0] } },
                cross_dept: { $sum: { $cond: [{ $eq: ['$status', 'cross_dept'] }, 1, 0] } },
            }},
            { $project: { _id: 0, batch: '$_id', total: 1, approved: 1, pending: 1, flagged: 1, unmatched: 1, cross_dept: 1 } },
            { $sort: { batch: 1 } },
        ]);
        // Dept-admins only ever see their own department's batches here —
        // this route carries no batch/dept param for enforceAttendanceDepartment
        // to check, so the scoping has to happen in the controller itself.
        // Filtering post-aggregation is fine: the group above is one row per
        // batch, a small result set, not per-document.
        const scoped = req.attendanceFullAccess
            ? agg
            : agg.filter((row) => batchBelongsToDepartment(row.batch, req.attendanceDepartment));
        res.json({ batches: scoped });
    }
}

module.exports = RollAssignController;
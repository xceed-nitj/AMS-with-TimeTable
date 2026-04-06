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

    // ─── List ALL person_XXX folders in a batch (for pre-ERP photo editing) ──
    async listAllClusters(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const entries = await fsPromises.readdir(batchPath, { withFileTypes: true });
            const clusters = [];

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                if (!(/^person_\d+$/i.test(entry.name))) continue;

                const folderPath = path.join(batchPath, entry.name);
                const files      = await fsPromises.readdir(folderPath);
                const images     = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

                // Collect per-file mtime for "added on" display
                const imageFilesWithDate = await Promise.all(images.map(async img => {
                    let addedAt = null;
                    try {
                        const st = await fsPromises.stat(path.join(folderPath, img));
                        addedAt = (st.birthtime && st.birthtime.getTime() > 0 ? st.birthtime : st.mtime).toISOString();
                    } catch (_) {}
                    return { filename: img, addedAt };
                }));

                clusters.push({
                    folderName:   entry.name,
                    imageCount:   images.length,
                    imageFiles:   imageFilesWithDate,
                });
            }

            clusters.sort((a, b) => a.folderName.localeCompare(b.folderName));
            res.json({ batch, clusters });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Delete an entire cluster folder + its DB record ──────────────
    async deleteCluster(req, res) {
        try {
            const { batch, folder } = req.params;
            if (!(/^person_\d+$/i.test(folder))) {
                return res.status(400).json({ error: 'Only person_XXX folders can be deleted here' });
            }
            const folderPath = path.join(GROUND_TRUTH_DIR, batch, folder);
            if (fs.existsSync(folderPath)) {
                await fsPromises.rm(folderPath, { recursive: true, force: true });
            }
            await ClusterMatch.deleteOne({ batch, folderName: folder });
            res.json({ ok: true, deleted: folder });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Delete a single photo from a cluster folder ───────────────────
    async deleteClusterPhoto(req, res) {
        try {
            const { batch, folder, filename } = req.params;
            if (!(/^person_\d+$/i.test(folder))) {
                return res.status(400).json({ error: 'Only person_XXX folders supported' });
            }
            const safeFilename = path.basename(filename);
            const photoPath    = path.join(GROUND_TRUTH_DIR, batch, folder, safeFilename);
            if (fs.existsSync(photoPath)) {
                await fsPromises.unlink(photoPath);
            }
            res.json({ ok: true, deleted: safeFilename });
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

                    let actualFolder  = suggestedRollNo;
                    let copiedFiles   = imageFiles;
                    let alreadyRenamed = false;

                    if (fs.existsSync(srcPath)) {
                        if (fs.existsSync(destPath)) {
                            // ── Conflict: rollNo folder already exists ────────
                            // Merge new photos in as UNAPPROVED (not added to approved_files).
                            // They will show up in the assign page for the operator to review.
                            const srcFiles = await fsPromises.readdir(srcPath);
                            const srcImages = srcFiles.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                            const prefix    = `new_${Date.now()}_`;
                            const mergedNames = [];
                            for (const img of srcImages) {
                                const newName = prefix + img;
                                await fsPromises.copyFile(
                                    path.join(srcPath, img),
                                    path.join(destPath, newName)
                                );
                                mergedNames.push(newName);
                            }
                            // Delete person_XXX
                            await fsPromises.rm(srcPath, { recursive: true, force: true });
                            // DO NOT add mergedNames to approved_files — they stay unapproved

                            await ClusterMatch.findOneAndUpdate(
                                { batch, folderName },
                                {
                                    $set: {
                                        currentFolder: suggestedRollNo,
                                        rollNo:        suggestedRollNo,
                                        status:        'merged_unapproved',
                                        approved:      false,
                                        erpPhoto:      matchData.best.erpPhoto,
                                        confidence:    matchData.best.confidence,
                                        candidates:    matchData.candidates  || [],
                                        imageFiles:    mergedNames,
                                        embeddingFiles: [],
                                        previewFiles:  mergedNames.slice(0, 6),
                                        imageCount:    mergedNames.length,
                                        error:         null,
                                        updated_at:    new Date(),
                                    },
                                },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            );
                            conflicts++;
                            return;
                        }

                        // Copy images (+ _info.json) to rollNo folder, delete person_XXX
                        copiedFiles  = await copyImages(srcPath, destPath);
                        await fsPromises.rm(srcPath, { recursive: true, force: true });

                    } else if (fs.existsSync(destPath)) {
                        // ── Already renamed in a previous partial run ────────
                        // person_XXX is gone, rollNo folder already exists.
                        // Re-read files from the destination and just fix up the DB record.
                        const destData = await readFolderFiles(destPath);
                        copiedFiles    = destData.imageFiles;
                        embeddingFiles = destData.embeddingFiles;
                        alreadyRenamed = true;
                    }

                    // ── Write _info.json to rollNo folder ─────────────────
                    // Skip if the folder was already set up in a previous run (_info.json exists).
                    if (!alreadyRenamed) {
                        const allFiles = copiedFiles;
                        let finalEmbeds;
                        if (allFiles.length <= 5) {
                            finalEmbeds = [...allFiles];
                        } else {
                            finalEmbeds = embeddingFiles.filter(f => allFiles.includes(f));
                            if (finalEmbeds.length === 0) finalEmbeds = allFiles.slice(0, 5);
                        }
                        const finalBackups = allFiles.filter(f => !finalEmbeds.includes(f));
                        await fsPromises.writeFile(
                            path.join(GROUND_TRUTH_DIR, batch, actualFolder, '_info.json'),
                            JSON.stringify({
                                embedding_files: finalEmbeds,
                                backup_files:    finalBackups,
                                approved_files:  [...allFiles], // all initial photos pre-approved
                            }, null, 2)
                        );
                        embeddingFiles = finalEmbeds;
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


     async saveMatchResult(req, res) {
        try {
            const { batch, folderName, matchData } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }
 
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            const srcPath   = path.join(batchPath, folderName);
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
                return res.json({ ok: true, status: 'unmatched', folderName });
            }
 
            // ── Has a best match — save with matched status (NOT renamed yet) ────
            const suggestedRollNo = matchData.best.rollNo.trim().toUpperCase();
 
            await ClusterMatch.findOneAndUpdate(
                { batch, folderName },
                {
                    $set: {
                        currentFolder:  folderName,           // still person_XXX for now
                        rollNo:         suggestedRollNo,      // suggested target rollNo
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

            // Build matchMap keyed by folderName for the frontend
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            const matchMap  = {};
            const repairs   = [];

            for (const r of records) {
                let currentFolder = r.currentFolder || r.folderName;

                // ── Self-healing: if stored currentFolder no longer exists on disk
                // but the rollNo folder does, the folder was already renamed in a
                // previous run that failed before the DB update.  Fix it now.
                if (
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
                    folderName:    r.folderName,
                    currentFolder,
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
            }

            // Fire-and-forget DB repairs (don't block the response)
            if (repairs.length) Promise.all(repairs).catch(() => {});

            res.json({ batch, matchMap, total: records.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Approve a match (operator confirms ERP suggestion) ───────
    // If rollNo matches current folder → just set approved=true (no file ops).
    // If override rollNo differs from current folder:
    //   - dest folder doesn't exist → rename src → dest
    //   - dest folder exists         → merge src photos into dest as approved
    async approve(req, res) {
        try {
            const { batch, folderName, rollNo: overrideRollNo } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }

            // Allow approving even without a prior DB record (e.g. manual assignment
            // of a person_XXX folder directly). Create a minimal record if missing.
            let record = await ClusterMatch.findOne({ batch, folderName });
            const finalRollNo = overrideRollNo
                ? overrideRollNo.trim().toUpperCase()
                : record?.rollNo || null;

            if (!finalRollNo) {
                return res.status(400).json({ error: 'No roll number available — provide rollNo in body' });
            }

            if (!record) {
                // No prior DB record: treat folderName as currentFolder
                record = { batch, folderName, currentFolder: folderName, rollNo: finalRollNo,
                           imageFiles: [], embeddingFiles: [] };
            }

            const currentFolder    = record.currentFolder || record.folderName;
            let   imageFiles       = [...(record.imageFiles || [])];
            let   mergedIntoExisting = false;

            // ── File operations when dest differs from current ────────
            if (finalRollNo !== currentFolder) {
                const batchPath = path.join(GROUND_TRUTH_DIR, batch);
                const srcPath   = path.join(batchPath, currentFolder);
                const destPath  = path.join(batchPath, finalRollNo);

                if (fs.existsSync(srcPath)) {
                    if (fs.existsSync(destPath)) {
                        // Merge: copy photos into existing folder with timestamp prefix
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
                    // Add newly merged photos to approved_files + embed/backup slots
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
                    // Fresh or renamed folder: set embedding/backup from DB hints or defaults
                    if (!info.embedding_files?.length) {
                        const dbEmbeds = (record.embeddingFiles || []).filter(f => allFiles.includes(f));
                        info.embedding_files = dbEmbeds.length > 0 ? dbEmbeds
                            : allFiles.length <= EMBED_N ? [...allFiles] : allFiles.slice(0, EMBED_N);
                        info.backup_files = allFiles.filter(f => !info.embedding_files.includes(f));
                    }
                    // Mark all present files as approved
                    if (!info.approved_files?.length) {
                        info.approved_files = [...allFiles];
                    }
                }

                await fsPromises.writeFile(infoPath, JSON.stringify(info, null, 2));
            }

            // ── Upsert DB record ──────────────────────────────────────
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
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
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
    // Supports both:
    //   /erp-photo/:batch/:filename  → erp_photos/{batch}/{filename}
    //   /erp-photo/:filename         → erp_photos/{filename}  (legacy fallback)
    async serveErpPhoto(req, res) {
        try {
            const { batch, filename } = req.params;
            const safeFilename = path.basename(filename);
            const safeBatch    = batch ? path.basename(batch) : null;

            // Try batch subfolder first (new structure)
            if (safeBatch) {
                const batchPath = path.join(ERP_PHOTOS_DIR, safeBatch, safeFilename);
                if (fs.existsSync(batchPath)) return res.sendFile(batchPath);
            }

            // Fall back to flat root (legacy)
            const flatPath = path.join(ERP_PHOTOS_DIR, safeFilename);
            if (fs.existsSync(flatPath)) return res.sendFile(flatPath);

            // Search all batch subfolders
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

    // ─── Auto-match clusters to ERP photos (SSE stream) ──────────
    async autoMatch(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }
            // Prefer batch-specific ERP subfolder: erp_photos/{batch}/
            // Fall back to root erp_photos/ for backward compatibility
            const batchErpDir = path.join(ERP_PHOTOS_DIR, batch);
            const erpDir      = fs.existsSync(batchErpDir) ? batchErpDir : ERP_PHOTOS_DIR;

            const erpFiles = fs.existsSync(erpDir)
                ? fs.readdirSync(erpDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                : [];
            if (!erpFiles.length) {
                return res.status(400).json({
                    error: `No ERP photos found. Place student photos named {rollNo}.jpg in erp_photos/${batch}/`,
                });
            }

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const response = await axios.post(
                `${ML_SERVICE_URL}/match-clusters-to-erp`,
                { batch_dir: batchPath, erp_photos_dir: erpDir, top_k: 3 },
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

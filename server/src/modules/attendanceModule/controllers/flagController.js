// server/src/modules/attendanceModule/controllers/flagController.js
// Handles everything related to flagged clusters:
//   flagCluster, listFlagged, resolveFlag
// Photo/folder delete reuse the same filesystem helpers as rollAssignController
// but are re-implemented here so flagController is fully self-contained.

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;

const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');

const GROUND_TRUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'ground_truth');
const ERP_PHOTOS_DIR   = process.env.ERP_PHOTOS_DIR ||
                          path.join(__dirname, '..', '..', '..', '..', 'erp_photos');

// ── Shared helpers ────────────────────────────────────────────────

function flagsPath(batch) {
    return path.join(GROUND_TRUTH_DIR, batch, '_flags.json');
}

async function readFlags(batch) {
    const fp = flagsPath(batch);
    if (!fs.existsSync(fp)) return [];
    try {
        return JSON.parse(await fsPromises.readFile(fp, 'utf8'));
    } catch (_) {
        return [];
    }
}

async function writeFlags(batch, flags) {
    const fp = flagsPath(batch);
    await fsPromises.mkdir(path.dirname(fp), { recursive: true });
    await fsPromises.writeFile(fp, JSON.stringify(flags, null, 2));
}

// Copy images + _info.json from srcDir → destDir, return image filenames only
async function copyImages(srcDir, destDir) {
    await fsPromises.mkdir(destDir, { recursive: true });
    const files  = await fsPromises.readdir(srcDir);
    const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    const toCopy = [...images];
    if (files.includes('_info.json')) toCopy.push('_info.json');
    await Promise.all(
        toCopy.map(f =>
            fsPromises.copyFile(path.join(srcDir, f), path.join(destDir, f))
        )
    );
    return images;
}

// Read imageFiles + embeddingFiles from a folder (checks _info.json)
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

// ─────────────────────────────────────────────────────────────────
class FlagController {

    // ── POST /flag
    // Mark a cluster as flagged (operator rejected the ERP suggestion).
    // Updates ClusterMatch status → 'flagged' and appends to _flags.json.
    async flagCluster(req, res) {
        try {
            const { batch, folderName, suggestedRollNo, confidence, reason } = req.body;
            if (!batch || !folderName) {
                return res.status(400).json({ error: 'batch and folderName required' });
            }

            // Update DB status
            await ClusterMatch.findOneAndUpdate(
                { batch, folderName },
                { $set: { status: 'flagged', approved: false, updated_at: new Date() } },
                { upsert: false }
            );

            // Append / replace in _flags.json
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

            res.json({ ok: true, message: `Flagged ${folderName}`, folderName });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── GET /flagged/:batch
    // Return all open (unresolved) flagged clusters for a batch,
    // enriched with erpPhoto + candidates from ClusterMatch.
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
                // DB record carries erpPhoto, candidates that _flags.json doesn't store
                const dbRecord   = await ClusterMatch.findOne({ batch, folderName: flag.folderName }).lean();
                const folder     = dbRecord?.currentFolder || flag.folderName;
                const folderPath = path.join(batchPath, folder);

                let previewFiles = [];
                if (fs.existsSync(folderPath)) {
                    const files = await fsPromises.readdir(folderPath);
                    previewFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0, 6);
                } else if (dbRecord?.previewFiles?.length) {
                    previewFiles = dbRecord.previewFiles;
                }

                return {
                    // From _flags.json
                    folderName:      flag.folderName,
                    suggestedRollNo: flag.suggestedRollNo || dbRecord?.rollNo     || null,
                    confidence:      flag.confidence      ?? dbRecord?.confidence  ?? null,
                    reason:          flag.reason          || 'operator_rejected',
                    flaggedAt:       flag.flaggedAt        || null,
                    resolved:        flag.resolved         || false,
                    resolvedRollNo:  flag.resolvedRollNo   || null,
                    // From DB record (missing from old listFlagged)
                    erpPhoto:        dbRecord?.erpPhoto    || null,
                    candidates:      dbRecord?.candidates  || [],
                    imageCount:      dbRecord?.imageCount  || previewFiles.length,
                    imageFiles:      dbRecord?.imageFiles  || [],
                    // Computed
                    currentFolder:   folder,
                    previewFiles,
                };
            }));

            res.json({ batch, flagged: enriched, total: enriched.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── POST /resolve-flag
    // Assign the correct rollNo to a flagged cluster.
    // Reuses the same rename + merge + _info.json logic as rollAssignController.approve().
    async resolveFlag(req, res) {
        try {
            const { batch, folderName, rollNo } = req.body;
            if (!batch || !folderName || !rollNo) {
                return res.status(400).json({ error: 'batch, folderName, rollNo required' });
            }

            const finalRollNo = rollNo.trim().toUpperCase();

            const record = await ClusterMatch.findOne({ batch, folderName }).lean();
            const currentFolder = record?.currentFolder || folderName;

            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            const srcPath   = path.join(batchPath, currentFolder);
            const destPath  = path.join(batchPath, finalRollNo);

            let imageFiles         = record?.imageFiles || [];
            let mergedIntoExisting = false;

            // ── Folder rename / merge ─────────────────────────────
            if (finalRollNo !== currentFolder && fs.existsSync(srcPath)) {
                if (fs.existsSync(destPath)) {
                    // Dest exists → merge src photos in with a timestamp prefix
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
                    // Simple rename
                    imageFiles = await copyImages(srcPath, destPath);
                    await fsPromises.rm(srcPath, { recursive: true, force: true });
                }
            }

            // ── Update _info.json in final folder ─────────────────
            const EMBED_N    = 5;
            const folderPath = path.join(batchPath, finalRollNo);
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
                        info.embedding_files = [...existingEmbeds, ...imageFiles.slice(0, embedSlots)];
                        info.backup_files    = [...existingBackups, ...imageFiles.slice(embedSlots)];
                    } else {
                        info.backup_files = [...existingBackups, ...imageFiles];
                    }
                } else {
                    if (!info.embedding_files?.length) {
                        const dbEmbeds = (record?.embeddingFiles || []).filter(f => allFiles.includes(f));
                        info.embedding_files = dbEmbeds.length > 0
                            ? dbEmbeds
                            : allFiles.length <= EMBED_N ? [...allFiles] : allFiles.slice(0, EMBED_N);
                        info.backup_files = allFiles.filter(f => !info.embedding_files.includes(f));
                    }
                    if (!info.approved_files?.length) {
                        info.approved_files = [...allFiles];
                    }
                }

                await fsPromises.writeFile(infoPath, JSON.stringify(info, null, 2));
            }

            // ── Upsert ClusterMatch ───────────────────────────────
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

            // ── Mark flag as resolved ─────────────────────────────
            const flags = await readFlags(batch);
            const updated = flags.map(f =>
                f.folderName === folderName
                    ? { ...f, resolved: true, resolvedRollNo: finalRollNo, resolvedAt: new Date().toISOString() }
                    : f
            );
            await writeFlags(batch, updated);

            res.json({ ok: true, approved: true, rollNo: finalRollNo, folderName });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── DELETE /cluster/:batch/:folder
    // Delete a flagged cluster's entire folder + DB record + flag entry.
    // Accepts optional body.currentFolder for renamed folders.
    async deleteCluster(req, res) {
        try {
            const { batch, folder } = req.params;
            const currentFolder = req.body?.currentFolder || folder;
            const safeOriginal  = path.basename(folder);
            const safeCurrent   = path.basename(currentFolder);

            // Delete folder on disk
            const currentPath = path.join(GROUND_TRUTH_DIR, batch, safeCurrent);
            if (fs.existsSync(currentPath)) {
                await fsPromises.rm(currentPath, { recursive: true, force: true });
            }
            if (safeOriginal !== safeCurrent) {
                const originalPath = path.join(GROUND_TRUTH_DIR, batch, safeOriginal);
                if (fs.existsSync(originalPath)) {
                    await fsPromises.rm(originalPath, { recursive: true, force: true });
                }
            }

            // Remove DB record
            await ClusterMatch.deleteOne({ batch, folderName: safeOriginal });

            // Remove from _flags.json
            const flags = await readFlags(batch);
            await writeFlags(batch, flags.filter(f => f.folderName !== safeOriginal));

            res.json({ ok: true, deleted: safeOriginal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── DELETE /cluster-photo/:batch/:folder/:filename
    // Delete a single photo from a flagged cluster folder.
    // Cleans _info.json references and syncs ClusterMatch.imageFiles.
    async deleteClusterPhoto(req, res) {
        try {
            const { batch, folder, filename } = req.params;
            const safeFolder   = path.basename(folder);
            const safeFilename = path.basename(filename);

            if (!safeFolder || !safeFilename) {
                return res.status(400).json({ error: 'Invalid folder or filename' });
            }

            const photoPath = path.join(GROUND_TRUTH_DIR, batch, safeFolder, safeFilename);
            if (fs.existsSync(photoPath)) {
                await fsPromises.unlink(photoPath);
            }

            // Clean _info.json references
            const infoPath = path.join(GROUND_TRUTH_DIR, batch, safeFolder, '_info.json');
            if (fs.existsSync(infoPath)) {
                try {
                    const info = JSON.parse(await fsPromises.readFile(infoPath, 'utf8'));
                    const rm   = (arr) => (arr || []).filter(f => f !== safeFilename);
                    info.embedding_files = rm(info.embedding_files);
                    info.backup_files    = rm(info.backup_files);
                    info.approved_files  = rm(info.approved_files);
                    if (info.scores) delete info.scores[safeFilename];
                    await fsPromises.writeFile(infoPath, JSON.stringify(info, null, 2));
                } catch (_) {}
            }

            // Sync ClusterMatch.imageFiles
            try {
                const doc = await ClusterMatch.findOne({ batch, folderName: safeFolder });
                if (doc) {
                    doc.imageFiles = (doc.imageFiles || []).filter(f => f !== safeFilename);
                    await doc.save();
                }
            } catch (_) {}

            res.json({ ok: true, deleted: safeFilename });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── GET /all-clusters/:batch
    // List all person_XXX folders on disk (used by edit mode photo grid).
    // Proxied here so flaggedassign.jsx only needs one base URL.
    async listAllClusters(req, res) {
        try {
            const { batch } = req.params;
            const batchPath = path.join(GROUND_TRUTH_DIR, batch);
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch not found' });
            }

            const entries  = await fsPromises.readdir(batchPath, { withFileTypes: true });
            const clusters = [];

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
                if (!(/^person_\d+$/i.test(entry.name))) continue;

                const folderPath = path.join(batchPath, entry.name);
                const files      = await fsPromises.readdir(folderPath);
                const images     = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

                const imageFilesWithDate = await Promise.all(images.map(async img => {
                    let addedAt = null;
                    try {
                        const st = await fsPromises.stat(path.join(folderPath, img));
                        addedAt  = (st.birthtime?.getTime() > 0 ? st.birthtime : st.mtime).toISOString();
                    } catch (_) {}
                    return { filename: img, addedAt };
                }));

                clusters.push({ folderName: entry.name, imageCount: images.length, imageFiles: imageFilesWithDate });
            }

            clusters.sort((a, b) => a.folderName.localeCompare(b.folderName));
            res.json({ batch, clusters });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ── GET /photo/:batch/:folder/:filename
    // Serve a photo file (same as rollAssignController.servePhoto).
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

    // ── GET /erp-photo/:batch/:filename
    // Serve an ERP photo (same lookup logic as rollAssignController.serveErpPhoto).
    async serveErpPhoto(req, res) {
        try {
            const { batch, filename } = req.params;
            const safeFilename = path.basename(filename);
            const safeBatch    = batch ? path.basename(batch) : null;

            if (safeBatch) {
                const batchPath = path.join(ERP_PHOTOS_DIR, safeBatch, safeFilename);
                if (fs.existsSync(batchPath)) return res.sendFile(batchPath);
            }

            const flatPath = path.join(ERP_PHOTOS_DIR, safeFilename);
            if (fs.existsSync(flatPath)) return res.sendFile(flatPath);

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
}

module.exports = FlagController;
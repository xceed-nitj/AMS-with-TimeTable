// server/src/modules/attendanceModule/controllers/groundTruthUploadController.js

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const JSZip      = require('jszip');
const crypto     = require('crypto');
const Batch      = require('../../../models/attendanceModule/batch');
const erpSync    = require('./erpEmbeddingSyncHelper');

// ─── Constants ────────────────────────────────────────────────────────────────
const ERP_PHOTOS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'erp_photos');
const ERP_EMBED_DIR  = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'embeddings', 'erp');

const MAX_FILES_IN_ZIP  = 500;
const MAX_IMAGE_SIZE    = 10 * 1024 * 1024;   // 10 MB per image
const MAX_TOTAL_SIZE    = 100 * 1024 * 1024;  // 100 MB cumulative extracted

// ─── Magic byte signatures for image validation ──────────────────────────────
const IMAGE_SIGNATURES = {
    jpg:  [0xFF, 0xD8, 0xFF],
    jpeg: [0xFF, 0xD8, 0xFF],
    png:  [0x89, 0x50, 0x4E, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46],  // RIFF header
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

ensureDir(ERP_PHOTOS_DIR);

/**
 * Sanitizes a batch name.
 * Strips whitespace; rejects empty values.
 * Path traversal is caught downstream by assertInsideRoot().
 */
function sanitizeBatch(batch) {
    if (!batch) throw new Error('Batch name is required');
    const normalized = String(batch).trim();
    if (!normalized) throw new Error('Batch name is required');
    return normalized;
}

/**
 * Sanitizes a roll number.
 * Trims and uppercases; rejects empty values.
 * Path traversal is caught downstream by assertInsideRoot().
 */
function sanitizeRollNo(rollNo) {
    const normalized = String(rollNo || '').trim().toUpperCase();
    if (!normalized) throw new Error('Invalid roll number');
    return normalized;
}

/**
 * Ensures a resolved path stays inside the ERP_PHOTOS_DIR root.
 * Prevents any path traversal that slips past sanitization.
 * Fixes: MED-3 / CRITICAL-1 (filesystem safety via resolve checks)
 */
function assertInsideRoot(targetPath) {
    const resolved = path.resolve(targetPath);
    const root     = path.resolve(ERP_PHOTOS_DIR);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
        throw new Error('Path escapes erp_photos directory');
    }
    return resolved;
}

/**
 * Validates that a buffer contains a real image by checking magic bytes.
 * Fixes: MED-1 (magic byte / MIME spoofing)
 */
function isValidImage(buffer, ext) {
    const key = ext.replace('.', '').toLowerCase();
    const signature = IMAGE_SIGNATURES[key];
    if (!signature) return false;
    if (buffer.length < signature.length) return false;
    return signature.every((byte, i) => buffer[i] === byte);
}

// ─── Find pkl path for a batch (ML service saves under {dept}/{batch}/) ─────
function findEmbeddingPkl(batchName) {
    const parts = batchName.split('_');
    const department = parts.length >= 3 ? parts.slice(1, -1).join('_') : '';
    if (department) {
        const newPath = path.join(ERP_EMBED_DIR, department, batchName, 'embeddings_db.pkl');
        if (fs.existsSync(newPath)) return newPath;
    }
    // Fallback: flat path used before department subfolder convention
    const oldPath = path.join(ERP_EMBED_DIR, batchName, 'embeddings_db.pkl');
    if (fs.existsSync(oldPath)) return oldPath;
    return null;
}

// ─── Trigger Async Background Sync ────────────────────────────────────────────
// The ML service is stateless — it never reads erp_photos/ or writes the
// .pkl itself. This reads the relevant photo bytes (and the existing .pkl,
// for sync) here, sends them to Python, and persists whatever comes back.
// Still fire-and-forget from the caller's perspective: callers never await
// this, matching the previous behavior where the route handler responded
// before the sync completed.
async function triggerEmbeddingSync(action, payload) {
    const reqId = crypto.randomUUID();
    try {
        let department = 'UNKNOWN_DEPT';
        const parts = payload.batch.split('_');
        if (parts.length >= 3) {
            department = parts.slice(1, -1).join('_');
        }

        if (action === 'sync') {
            await erpSync.syncErpEmbeddings(payload.batch, department, payload.roll_nos || []);
        } else if (action === 'rename') {
            await erpSync.renameErpEmbedding(payload.batch, department, payload.old_roll_no, payload.new_roll_no);
        } else if (action === 'delete') {
            await erpSync.deleteErpEmbedding(payload.batch, department, payload.roll_no);
        }

    } catch (err) {
        console.error(`[GT Upload] [${reqId}] Failed to trigger sync for action=${action} batch=${payload.batch}:`, err.message);
    }
}

// ─── Controller ───────────────────────────────────────────────────────────────

class GroundTruthUploadController {

    // ─── Upload Batch ZIP ─────────────────────────────────────────────────
    async uploadBatchZip(req, res) {
        try {
            // ── Input validation ──────────────────────────────────────────
            const batch = sanitizeBatch(req.params.batch);
            if (!req.file) return res.status(400).json({ error: 'ZIP file is required' });

            const batchPath = path.join(ERP_PHOTOS_DIR, batch);
            assertInsideRoot(batchPath);
            ensureDir(batchPath);

            // ── Clear old contents if replacing ───────────────────────────
            if (req.query.replace === 'true') {
                const pklPath = findEmbeddingPkl(batch);
                if (pklPath) {
                    await fsPromises.unlink(pklPath);
                }
                console.log(`[GT Upload] Replaced existing embeddings database for batch=${batch}`);
            }

            // ── Parse ZIP ─────────────────────────────────────────────────
            const zip = await JSZip.loadAsync(req.file.buffer);

            // ── ZIP bomb protection: entry count ──────────────────────────
            const allEntries = Object.keys(zip.files).filter(k => !zip.files[k].dir);
            if (allEntries.length > MAX_FILES_IN_ZIP) {
                return res.status(400).json({
                    error: `ZIP contains too many files (${allEntries.length}). Maximum allowed: ${MAX_FILES_IN_ZIP}`
                });
            }

            let extractedImagesCount = 0;
            let totalExtractedBytes  = 0;
            let targetFolders   = new Set();
            let clearedFolders  = new Set();
            let errors          = [];

            // ── Extract images ────────────────────────────────────────────
            for (const relativePath of allEntries) {
                const zipEntry = zip.files[relativePath];

                // Skip macOS artifacts and hidden files
                const filenameRaw = relativePath.split('/').pop();
                if (relativePath.includes('__MACOSX') || filenameRaw.startsWith('.')) {
                    continue;
                }

                // Extension check
                if (!/\.(jpg|jpeg|png|webp)$/i.test(filenameRaw)) {
                    errors.push(`Skipped non-image file: ${filenameRaw}`);
                    continue;
                }

                // Extract roll number from filename
                const ext       = path.extname(filenameRaw);
                const rollNoRaw = path.basename(filenameRaw, ext);

                let rollNo;
                try {
                    rollNo = sanitizeRollNo(rollNoRaw);
                } catch (_) {
                    errors.push(`Invalid roll number in filename: ${filenameRaw}`);
                    continue;
                }

                // Enforce 1 photo per roll number
                if (clearedFolders.has(rollNo)) {
                    continue;
                }

                try {
                    // Decompress and validate size
                    const buffer = await zipEntry.async('nodebuffer');

                    if (buffer.length > MAX_IMAGE_SIZE) {
                        errors.push(`${filenameRaw} exceeds max size (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
                        continue;
                    }

                    totalExtractedBytes += buffer.length;
                    if (totalExtractedBytes > MAX_TOTAL_SIZE) {
                        errors.push('ZIP total decompressed size exceeds limit. Stopping extraction.');
                        break;
                    }

                    // Magic byte validation
                    if (!isValidImage(buffer, ext)) {
                        errors.push(`${filenameRaw} is not a valid image file (failed signature check)`);
                        continue;
                    }

                    // Delete existing photos for this student
                    const existingFiles = await fsPromises.readdir(batchPath);
                    for (const f of existingFiles) {
                        const fExt = path.extname(f);
                        const fRollNo = path.basename(f, fExt);
                        if (fRollNo.toUpperCase() === rollNo) {
                            const filePath = path.join(batchPath, f);
                            try {
                                await fsPromises.unlink(filePath);
                            } catch (unlinkErr) {
                                if (unlinkErr.code === 'EBUSY' || unlinkErr.code === 'EPERM') {
                                    console.warn(`[GT Upload] File locked, retrying unlink: ${filePath}`);
                                    await new Promise(r => setTimeout(r, 200));
                                    try {
                                        await fsPromises.unlink(filePath);
                                    } catch (e2) {
                                        if (fExt.toLowerCase() !== ext) {
                                            throw new Error(`File locked by another process.`);
                                        }
                                    }
                                } else {
                                    throw unlinkErr;
                                }
                            }
                        }
                    }
                    clearedFolders.add(rollNo);

                    // Write the new photo
                    const targetFilename = `${rollNo}${ext.toLowerCase()}`;
                    const targetPath     = path.join(batchPath, targetFilename);
                    assertInsideRoot(targetPath);

                    await fsPromises.writeFile(targetPath, buffer);

                    targetFolders.add(rollNo);
                    extractedImagesCount++;
                } catch (e) {
                    errors.push(`Failed to extract ${filenameRaw}: processing error`);
                    console.error(`[GT Upload] ZIP entry error for ${filenameRaw}:`, e);
                }
            }

            console.log(`[GT Upload] ZIP processed for batch=${batch}: ${extractedImagesCount} images, ${targetFolders.size} students`);

            res.json({
                message: 'ZIP extraction complete',
                extractedFolders: targetFolders.size,
                extractedImages: extractedImagesCount,
                errors: errors.length ? errors : undefined
            });

            // Trigger background sync
            if (targetFolders.size > 0) {
                const roll_nos = Array.from(targetFolders);
                const chunkSize = 1000;
                for (let i = 0; i < roll_nos.length; i += chunkSize) {
                    triggerEmbeddingSync('sync', {
                        batch: batch,
                        roll_nos: roll_nos.slice(i, i + chunkSize)
                    });
                }
            }

        } catch (err) {
            if (err.message === 'Invalid batch name' || err.message === 'Batch name is required') {
                return res.status(400).json({ error: err.message });
            }
            console.error('[GT Upload] ZIP extraction error:', err);
            res.status(500).json({ error: 'Failed to process ZIP file' });
        }
    }

    // ─── Upload Individual Student Photo ──────────────────────────────────
    async uploadStudentPhoto(req, res) {
        try {
            // ── Input validation ──────────────────────────────────────────
            const batch      = sanitizeBatch(req.params.batch);
            const safeRollNo = sanitizeRollNo(req.params.rollNo);

            if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

            const batchPath = path.join(ERP_PHOTOS_DIR, batch);
            assertInsideRoot(batchPath);
            ensureDir(batchPath);

            // ── Validate file content ─────────────────────────────────────
            const ext = path.extname(req.file.originalname).toLowerCase();
            if (!/^\.(jpg|jpeg|png|webp)$/.test(ext)) {
                return res.status(400).json({ error: 'Only JPG, PNG, and WEBP images are accepted' });
            }

            if (!isValidImage(req.file.buffer, ext)) {
                return res.status(400).json({ error: 'File does not appear to be a valid image' });
            }

            // ── Delete previous photos ────────────────────────────────────
            const existingFiles = await fsPromises.readdir(batchPath);
            for (const f of existingFiles) {
                const fExt = path.extname(f);
                const fRollNo = path.basename(f, fExt);
                if (fRollNo.toUpperCase() === safeRollNo) {
                    const filePath = path.join(batchPath, f);
                    try {
                        await fsPromises.unlink(filePath);
                    } catch (unlinkErr) {
                        if (unlinkErr.code === 'EBUSY' || unlinkErr.code === 'EPERM') {
                            console.warn(`[GT Upload] File locked, retrying unlink: ${filePath}`);
                            await new Promise(r => setTimeout(r, 200));
                            try {
                                await fsPromises.unlink(filePath);
                            } catch (e2) {
                                console.error(`[GT Upload] Unlink failed again for ${filePath}`);
                                if (fExt.toLowerCase() !== ext) {
                                    throw new Error(`File is locked by another process (e.g. ML Service) and cannot be replaced.`);
                                }
                            }
                        } else {
                            throw unlinkErr;
                        }
                    }
                }
            }

            // ── Write new photo ───────────────────────────────────────────
            const targetFilename = `${safeRollNo}${ext}`;
            const targetPath     = path.join(batchPath, targetFilename);
            assertInsideRoot(targetPath);

            await fsPromises.writeFile(targetPath, req.file.buffer);

            console.log(`[GT Upload] Photo uploaded: batch=${batch} rollNo=${safeRollNo} file=${targetFilename}`);

            res.json({
                message: 'Photo uploaded successfully',
                rollNo: safeRollNo,
                imagesAdded: 1
            });

            // Trigger background sync
            triggerEmbeddingSync('sync', {
                batch: batch,
                roll_nos: [safeRollNo]
            });

        } catch (err) {
            if (err.message === 'Invalid batch name' || err.message === 'Invalid roll number') {
                return res.status(400).json({ error: err.message });
            }
            console.error('[GT Upload] Photo upload error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ─── Rename Student Folder ────────────────────────────────────────────
    async renameStudent(req, res) {
        try {
            // ── Input validation ──────────────────────────────────────────
            const batch         = sanitizeBatch(req.body.batch);
            const safeOldRollNo = sanitizeRollNo(req.body.oldRollNo);
            const safeNewRollNo = sanitizeRollNo(req.body.newRollNo);

            if (safeOldRollNo === safeNewRollNo) {
                return res.json({ message: 'Roll number is unchanged', rollNo: safeNewRollNo });
            }

            const batchPath = path.join(ERP_PHOTOS_DIR, batch);
            assertInsideRoot(batchPath);
            
            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch folder not found' });
            }

            const existingFiles = await fsPromises.readdir(batchPath);
            
            let oldPhotoFile = null;
            let oldExt = '';
            
            for (const f of existingFiles) {
                const ext = path.extname(f);
                const roll = path.basename(f, ext);
                if (roll.toUpperCase() === safeOldRollNo) {
                    oldPhotoFile = f;
                    oldExt = ext;
                    break;
                }
            }

            if (!oldPhotoFile) {
                return res.status(404).json({ error: 'Original student photo not found' });
            }

            for (const f of existingFiles) {
                const ext = path.extname(f);
                const roll = path.basename(f, ext);
                if (roll.toUpperCase() === safeNewRollNo) {
                    return res.status(409).json({ error: `Destination photo for ${safeNewRollNo} already exists` });
                }
            }

            const srcPath = path.join(batchPath, oldPhotoFile);
            const destPath = path.join(batchPath, `${safeNewRollNo}${oldExt.toLowerCase()}`);
            assertInsideRoot(srcPath);
            assertInsideRoot(destPath);

            await fsPromises.rename(srcPath, destPath);

            console.log(`[GT Upload] Rename: batch=${batch} ${oldPhotoFile} -> ${safeNewRollNo}${oldExt.toLowerCase()}`);

            res.json({
                message: `Successfully renamed ${safeOldRollNo} to ${safeNewRollNo}`,
                oldRollNo: safeOldRollNo,
                newRollNo: safeNewRollNo
            });

            // Trigger background sync rename
            triggerEmbeddingSync('rename', {
                batch: batch,
                old_roll_no: safeOldRollNo,
                new_roll_no: safeNewRollNo
            });

        } catch (err) {
            if (err.message === 'Invalid batch name' || err.message === 'Invalid roll number' ||
                err.message === 'Batch name is required') {
                return res.status(400).json({ error: err.message });
            }
            console.error('[GT Upload] Rename error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ─── Delete Student Photo ───────────────────────────────────────────────
    async deletePhoto(req, res) {
        try {
            const batch = sanitizeBatch(req.params.batch);
            const safeRollNo = sanitizeRollNo(req.params.rollNo);

            const batchPath = path.join(ERP_PHOTOS_DIR, batch);
            assertInsideRoot(batchPath);

            if (!fs.existsSync(batchPath)) {
                return res.status(404).json({ error: 'Batch folder not found' });
            }

            const existingFiles = await fsPromises.readdir(batchPath);
            let photoDeleted = false;

            for (const f of existingFiles) {
                const ext = path.extname(f);
                const roll = path.basename(f, ext);
                if (roll.toUpperCase() === safeRollNo) {
                    const filePath = path.join(batchPath, f);
                    assertInsideRoot(filePath);
                    await fsPromises.unlink(filePath);
                    photoDeleted = true;
                }
            }

            if (!photoDeleted) {
                return res.status(404).json({ error: 'Photo not found' });
            }

            console.log(`[GT Upload] Delete: batch=${batch} rollNo=${safeRollNo}`);

            res.json({
                message: 'Photo deleted successfully',
                rollNo: safeRollNo
            });

            // Trigger background sync delete
            triggerEmbeddingSync('delete', {
                batch: batch,
                roll_no: safeRollNo
            });

        } catch (err) {
            if (err.message === 'Invalid batch name' || err.message === 'Invalid roll number' || err.message === 'Batch name is required') {
                return res.status(400).json({ error: err.message });
            }
            console.error('[GT Upload] Delete error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ─── Force Sync All ───────────────────────────────────────────────
    async syncAll(req, res) {
        try {
            const batch = sanitizeBatch(req.params.batch);
            const batchPath = path.join(ERP_PHOTOS_DIR, batch);
            assertInsideRoot(batchPath);

            let roll_nos = [];
            if (fs.existsSync(batchPath)) {
                const existingFiles = await fsPromises.readdir(batchPath);
                for (const f of existingFiles) {
                    const ext = path.extname(f);
                    const roll = path.basename(f, ext);
                    if (/^\.(jpg|jpeg|png|webp)$/i.test(ext)) {
                        roll_nos.push(roll.toUpperCase());
                    }
                }
            }

            // Immediately respond
            res.json({
                message: `Triggered sync for ${roll_nos.length} photos`,
                photosCount: roll_nos.length
            });

            if (roll_nos.length > 0) {
                const chunkSize = 1000;
                for (let i = 0; i < roll_nos.length; i += chunkSize) {
                    triggerEmbeddingSync('sync', {
                        batch: batch,
                        roll_nos: roll_nos.slice(i, i + chunkSize)
                    });
                }
            }

        } catch (err) {
            console.error('[GT Upload] syncAll error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ─── List Photos in a Batch ───────────────────────────────────────
    async listPhotos(req, res) {
        try {
            const batch = sanitizeBatch(req.params.batch);
            const batchPath = path.join(ERP_PHOTOS_DIR, batch);
            assertInsideRoot(batchPath);

            if (!fs.existsSync(batchPath)) {
                return res.json({ rollNos: [], count: 0, batch });
            }

            const files = await fsPromises.readdir(batchPath);
            const rollNos = files
                .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                .map(f => ({ rollNo: path.basename(f, path.extname(f)).toUpperCase(), ext: path.extname(f).toLowerCase() }))
                .sort((a, b) => a.rollNo.localeCompare(b.rollNo));

            res.json({ rollNos, count: rollNos.length, batch });
        } catch (err) {
            if (err.message === 'Invalid batch name' || err.message === 'Batch name is required') {
                return res.status(400).json({ error: err.message });
            }
            console.error('[GT Upload] listPhotos error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ─── Summary of All ERP Photo Batches ────────────────────────────
    async listAllBatches(req, res) {
        try {
            if (!fs.existsSync(ERP_PHOTOS_DIR)) {
                return res.json({ batches: [] });
            }

            const entries = await fsPromises.readdir(ERP_PHOTOS_DIR, { withFileTypes: true });
            const batches = [];

            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const batchPath = path.join(ERP_PHOTOS_DIR, entry.name);
                const files = await fsPromises.readdir(batchPath);
                const count = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
                const pklPath = findEmbeddingPkl(entry.name);
                let hasEmbedding = false, embeddingUpdatedAt = null;
                if (pklPath) {
                    hasEmbedding = true;
                    try { embeddingUpdatedAt = fs.statSync(pklPath).mtime; } catch (_) {}
                }
                batches.push({ batch: entry.name, count, hasEmbedding, embeddingUpdatedAt });
            }

            batches.sort((a, b) => a.batch.localeCompare(b.batch));
            res.json({ batches });
        } catch (err) {
            console.error('[GT Upload] listAllBatches error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ─── Check if ERP pkl exists (filesystem only, no ML call) ───────
    async checkEmbedding(req, res) {
        try {
            const batch   = sanitizeBatch(req.params.batch);
            const pklPath = findEmbeddingPkl(batch);
            let updatedAt = null;
            if (pklPath) {
                try { updatedAt = fs.statSync(pklPath).mtime; } catch (_) {}
            }
            res.json({ available: !!pklPath, updatedAt });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Get Sync Status ───────────────────────────────────────────────
    async getStatus(req, res) {
        try {
            const batchString = sanitizeBatch(req.params.batch);
            let department = 'UNKNOWN_DEPT';
            const parts = batchString.split('_');
            if (parts.length >= 3) {
                department = parts.slice(1, -1).join('_');
            }

            const data = await erpSync.getErpStatus(batchString, department);
            res.json(data);
        } catch (e) {
            console.error('[GT Upload] status proxy error:', e.message);
            res.status(502).json({ error: 'Failed to fetch status from ML service' });
        }
    }
}

module.exports = GroundTruthUploadController;

// server/src/modules/attendanceModule/controllers/groundTruthUploadController.js

const path       = require('path');
const fs         = require('fs');
const fsPromises = require('fs').promises;
const JSZip      = require('jszip');

// ─── Constants ────────────────────────────────────────────────────────────────
const ERP_PHOTOS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'ml-data', 'erp_photos');

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
                            await fsPromises.unlink(path.join(batchPath, f));
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
                    await fsPromises.unlink(path.join(batchPath, f));
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

        } catch (err) {
            if (err.message === 'Invalid batch name' || err.message === 'Invalid roll number' ||
                err.message === 'Batch name is required') {
                return res.status(400).json({ error: err.message });
            }
            console.error('[GT Upload] Rename error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = GroundTruthUploadController;

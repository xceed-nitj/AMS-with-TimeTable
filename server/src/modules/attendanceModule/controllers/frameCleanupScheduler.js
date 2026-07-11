// server/src/modules/attendanceModule/controllers/frameCleanupScheduler.js
//
// Issue #1544 — Auto-delete frames and annotated frames
//
// Rules (Updated according to guidelines):
//   1. Active folders (< 7 days) are left completely untouched to protect dev/live assets.
//   2. For folders older than 7 days (>= 7 days):
//        - Raw frames  → delete ALL (not needed after 7 days)
//        - Annotated frames → per camera, keep strictly ONE frame with the
//          highest face count; delete everything else (2 frames total per period).
//
// Folder format actually produced in practice:
//   {ROOM_CLEAN}_{SLOT_CLEAN}_{YYYYMMDD}
//   e.g.  LT103_PERIOD3_20260415
//
// File format actually produced in practice — the face count is embedded
// directly in the filename (there is no `_faces.json` sidecar written):
//   {YYYY-MM-DD}_period{N}_cam{N}_{elapsed}s_{faces}faces.jpg
//   e.g.  2026-04-15_period1_cam1_6s_13faces.jpg
//
// NOTE: an older doc comment here previously described a different,
// sidecar-based format (`frame_{elapsed:04d}s_cam{N}.jpg` + `_faces.json`).
// That format is not what's actually on disk, and the parsing below was
// silently falling back to faces=0 for every real file as a result —
// meaning "keep highest face count" was effectively "keep whichever file
// readdir happened to return first". Fixed below to parse the real
// filenames; the sidecar path is kept only as a secondary fallback in
// case some other producer of these folders still writes one.

'use strict';

const path       = require('path');
const fsSync     = require('fs');
const fs         = require('fs').promises;
const cron       = require('node-cron');
const FrameCleanupSettings = require('../../../models/attendanceModule/frameCleanupSettings');

// ── Paths (match rtsp_routes.py exactly) ─────────────────────────────────────
const SERVER_ROOT        = path.join(__dirname, '..', '..', '..', '..');
const RAW_DIR            = path.join(SERVER_ROOT, 'ml-data', 'frame_snapshots');
const ANNOTATED_DIR      = path.join(SERVER_ROOT, 'ml-data', 'annotated_frames');

const SEVEN_DAYS_MS      = 7 * 24 * 60 * 60 * 1000;
const IMAGE_EXT_RE       = /\.(jpg|jpeg|png|webp)$/i;

// ── Parse YYYYMMDD from folder name ──────────────────────────────────────────
function parseFolderDateMs(folderName) {
    const m = /(\d{8})$/.exec(folderName);
    if (!m) return null;
    const s = m[1];
    const ms = Date.UTC(
        parseInt(s.slice(0, 4), 10),
        parseInt(s.slice(4, 6), 10) - 1,
        parseInt(s.slice(6, 8), 10),
    );
    return isNaN(ms) ? null : ms;
}

// ── Parse camera number from filename ────────────────────────────────────────
function parseCam(filename) {
    const m = /cam(\d+)/i.exec(filename);
    return m ? parseInt(m[1], 10) : 0;
}

// ── Parse elapsed seconds from filename ──────────────────────────────────────
// Matches "..._6s_..." — the elapsed-seconds segment sits between the cam
// number and the face-count segment in the real filenames
// (e.g. "..._cam1_6s_13faces.jpg"), not immediately before "s_cam" as an
// earlier version of this file assumed.
function parseElapsed(filename) {
    const m = /_(\d+)s_/i.exec(filename);
    return m ? parseInt(m[1], 10) : 0;
}

// ── Parse face count embedded directly in the filename ────────────────────────
// This is the real source of truth in practice — filenames look like
// "2026-04-15_period1_cam1_6s_13faces.jpg", i.e. "<N>faces" right before
// the extension. Returns null if the filename doesn't carry a count at
// all, so callers can fall back to the sidecar/elapsed-based guesses.
function parseFaceCountFromFilename(filename) {
    const m = /(\d+)\s*faces?\b/i.exec(filename);
    return m ? parseInt(m[1], 10) : null;
}

// ── Read _faces.json sidecar written by attendanceSessionController ───────────
async function readFacesSidecar(folderPath) {
    try {
        const raw = await fs.readFile(path.join(folderPath, '_faces.json'), 'utf8');
        return JSON.parse(raw);
    } catch (_) {
        return {};
    }
}

// Sidecar entries were plain face-count ints before roll numbers were added
// ({ faces, rolls } objects since); normalize both to a number — null (not
// undefined) so a ?? chain can still fall through to the next guess.
function sidecarFaces(entry) {
    if (typeof entry === 'number') return entry;
    if (entry && typeof entry.faces === 'number') return entry.faces;
    return null;
}

// ── Delete a file safely ──────────────────────────────────────────────────────
async function safeUnlink(filePath) {
    try {
        await fs.unlink(filePath);
        return true;
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn(`[FrameCleanup] Could not delete ${filePath}: ${err.message}`);
        }
        return false;
    }
}

// ── Delete every image file inside a folder ───────────────────────────────────
async function deleteAllImages(folderPath) {
    let count = 0;
    let entries = [];
    try {
        entries = await fs.readdir(folderPath, { withFileTypes: true });
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn(`[FrameCleanup] readdir failed for ${folderPath}: ${err.message}`);
        }
        return 0;
    }
    for (const e of entries) {
        if (e.isFile() && IMAGE_EXT_RE.test(e.name)) {
            if (await safeUnlink(path.join(folderPath, e.name))) count++;
        }
    }
    return count;
}

// ── Keep best annotated frame per camera, delete the rest ────────────────────
async function pruneAnnotatedFolder(folderPath) {
    let kept = 0, deleted = 0;
    let entries = [];
    try {
        entries = await fs.readdir(folderPath, { withFileTypes: true });
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn(`[FrameCleanup] readdir failed for ${folderPath}: ${err.message}`);
        }
        return { kept, deleted };
    }

    const images = entries
        .filter(e => e.isFile() && IMAGE_EXT_RE.test(e.name))
        .map(e => e.name);

    if (images.length === 0) return { kept, deleted };

    const sidecar = await readFacesSidecar(folderPath);

    const byCam = new Map();
    for (const filename of images) {
        const cam = parseCam(filename);
        if (!byCam.has(cam)) byCam.set(cam, []);
        // Priority: real face count embedded in the filename (what's
        // actually produced) → _faces.json sidecar (if some other
        // producer writes one) → elapsed-seconds as a last-resort,
        // arbitrary tie-breaker so ties still resolve deterministically
        // rather than "whatever readdir returned first".
        const faces =
            parseFaceCountFromFilename(filename) ??
            sidecarFaces(sidecar[filename]) ??
            parseElapsed(filename);
        byCam.get(cam).push({ filename, faces });
    }

    for (const [cam, frames] of byCam) {
        frames.sort((a, b) => b.faces - a.faces);
        const keeper = frames[0];
        console.log(
            `[FrameCleanup]   KEEP cam${cam} → ${keeper.filename} (faces≈${keeper.faces})`
        );
        kept++;

        for (let i = 1; i < frames.length; i++) {
            if (await safeUnlink(path.join(folderPath, frames[i].filename))) {
                console.log(
                    `[FrameCleanup]    DEL cam${cam} → ${frames[i].filename} (faces≈${frames[i].faces})`
                );
                deleted++;
            }
        }
    }

    return { kept, deleted };
}

// ── Main cleanup ──────────────────────────────────────────────────────────────
async function runCleanup() {
    const nowMs    = Date.now();
    const cutoffMs = nowMs - SEVEN_DAYS_MS;

    console.log(`\n[FrameCleanup] ── Starting at ${new Date().toISOString()} ──`);
    console.log(`[FrameCleanup] Cutoff: ${new Date(cutoffMs).toISOString().slice(0, 10)}`);

    const stats = {
        oldFolders:       0,  // expired folders processed
        rawDeleted:       0,  // raw frame files deleted
        annotatedKept:    0,  // annotated frames kept (best per cam)
        annotatedDeleted: 0,  // annotated frames deleted (duplicates)
    };

    const folderMap = new Map();

    for (const [label, dir] of [['rawPath', RAW_DIR], ['annotatedPath', ANNOTATED_DIR]]) {
        let entries = [];
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        } catch (_) { continue; }

        for (const e of entries) {
            if (!e.isDirectory()) continue;
            const dateMs = parseFolderDateMs(e.name);
            if (dateMs === null) continue;  

            const rec = folderMap.get(e.name) ?? { dateMs };
            rec[label] = path.join(dir, e.name);
            folderMap.set(e.name, rec);
        }
    }

    // Process each folder
    for (const [name, info] of folderMap) {
        const isExpired = info.dateMs < cutoffMs;

        if (!isExpired) {
            // ── Sir's Rule 1: Folders less than 7 days old are left completely untouched ──
            console.log(`[FrameCleanup] ACTIVE (Less than 7 days) ${name} → Leaving completely untouched.`);
            continue;
        }

        // ── Sir's Rule 2: Folders 7+ days old → Run raw wipeout & annotated pruning ──
        console.log(`[FrameCleanup] EXPIRED (7+ days old) ${name} → Running best-shot pruning.`);

        // ── Rule 2a: delete ALL raw frames ────────────────────────────
        if (info.rawPath) {
            const n = await deleteAllImages(info.rawPath);
            if (n > 0) console.log(`[FrameCleanup]   raw: deleted ${n} files from ${name}`);
            stats.rawDeleted += n;
            
            // Raw images saaf hone par empty directory remove kar dete hain
            try {
                const remaining = await fs.readdir(info.rawPath);
                if (remaining.length === 0) await fs.rmdir(info.rawPath);
            } catch (_) {}
        }

        // ── Rule 2b: keep best annotated frame per camera ──────────────
        if (info.annotatedPath) {
            const { kept, deleted } = await pruneAnnotatedFolder(info.annotatedPath);
            stats.annotatedKept    += kept;
            stats.annotatedDeleted += deleted;
        }
        stats.oldFolders++;
    }

    console.log(`\n[FrameCleanup] ── Done ──`);
    console.log(`[FrameCleanup] Expired folders cleared : ${stats.oldFolders}`);
    console.log(`[FrameCleanup] Raw frames deleted      : ${stats.rawDeleted}`);
    console.log(`[FrameCleanup] Annotated kept (best)   : ${stats.annotatedKept}`);
    console.log(`[FrameCleanup] Annotated deleted (dups): ${stats.annotatedDeleted}`);

    try {
        const settings = await FrameCleanupSettings.getSettings();
        settings.lastRunAt = new Date();
        settings.lastRunStats = { ...stats };
        await settings.save();
    } catch (err) {
        console.warn('[FrameCleanup] Could not persist lastRunStats:', err.message);
    }

    return stats;
}

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Register the daily cron job (call once at server startup).
 * Runs at 02:00 every night — low traffic window. The job itself always
 * fires; whether it actually does anything is governed by the enabled
 * flag in FrameCleanupSettings, so toggling it in the settings UI takes
 * effect on the very next tick without a server restart.
 */
function startFrameCleanupScheduler() {
    cron.schedule('0 2 * * *', async () => {
        try {
            const settings = await FrameCleanupSettings.getSettings();
            if (!settings.enabled) {
                console.log('[FrameCleanup] Skipped — disabled via settings.');
                return;
            }
        } catch (err) {
            console.error('[FrameCleanup] Could not read settings, skipping this run:', err.message);
            return;
        }
        runCleanup().catch(err =>
            console.error('[FrameCleanup] Unhandled error:', err.message)
        );
    });
    console.log('[FrameCleanup] Scheduler registered — runs daily at 02:00 (subject to on/off setting)');
}

/**
 * Run immediately (for admin trigger or testing).
 */
async function runFrameCleanupNow() {
    return runCleanup();
}

module.exports = { startFrameCleanupScheduler, runFrameCleanupNow };
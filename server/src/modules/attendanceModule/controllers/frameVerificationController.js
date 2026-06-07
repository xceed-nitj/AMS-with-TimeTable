const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const ROOT_DIR = path.join(__dirname, '..', '..', '..', '..');
const RAW_FRAMES_DIR = path.join(ROOT_DIR, 'ml-data', 'frame_snapshots');
const ANNOTATED_FRAMES_DIR = path.join(ROOT_DIR, 'ml-data', 'annotated_frames');
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp)$/i;

function normalizeRoom(room) {
    return (room || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizePeriod(period) {
    return (period || '').trim().toUpperCase();
}

function normalizeDate(date) {
    return (date || '').trim().replace(/-/g, '');
}

function formatDate(dateDigits) {
    if (!/^\d{8}$/.test(dateDigits || '')) return '';
    return `${dateDigits.slice(0, 4)}-${dateDigits.slice(4, 6)}-${dateDigits.slice(6, 8)}`;
}

function parseFolderName(folderName) {
    const match = /^(.*)_(PERIOD[1-8])_(\d{8})$/i.exec(folderName || '');
    if (!match) return null;

    return {
        folder: folderName,
        room: normalizeRoom(match[1]),
        period: match[2].toLowerCase(),
        dateDigits: match[3],
        date: formatDate(match[3]),
    };
}

function parseFrameFilename(filename) {
    const currentMatch = /^frame_(\d+)s_cam(\d+)\.(jpg|jpeg|png|webp)$/i.exec(filename || '');
    if (currentMatch) {
        return {
            elapsedSec: Number(currentMatch[1]),
            camera: Number(currentMatch[2]),
            facesCount: null,
        };
    }

    const legacyMatch = /^\d{4}-\d{2}-\d{2}_period\d+_cam(\d+)_(\d+)s_(\d+)faces\.(jpg|jpeg|png|webp)$/i.exec(filename || '');
    if (legacyMatch) {
        return {
            elapsedSec: Number(legacyMatch[2]),
            camera: Number(legacyMatch[1]),
            facesCount: Number(legacyMatch[3]),
        };
    }

    return {
        elapsedSec: null,
        camera: null,
        facesCount: null,
    };
}

function comparePeriods(a, b) {
    const aNum = Number(String(a || '').replace(/^\D+/i, '')) || 0;
    const bNum = Number(String(b || '').replace(/^\D+/i, '')) || 0;
    return aNum - bNum;
}

async function listFolders(rootDir) {
    try {
        const entries = await fsPromises.readdir(rootDir, { withFileTypes: true });
        return entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => parseFolderName(entry.name))
            .filter(Boolean);
    } catch (_) {
        return [];
    }
}

async function getCombinedFolders() {
    const [rawFolders, annotatedFolders] = await Promise.all([
        listFolders(RAW_FRAMES_DIR),
        listFolders(ANNOTATED_FRAMES_DIR),
    ]);

    const combined = new Map();

    for (const item of rawFolders) {
        combined.set(item.folder, { ...item, hasRaw: true, hasAnnotated: false });
    }

    for (const item of annotatedFolders) {
        const existing = combined.get(item.folder);
        if (existing) {
            existing.hasAnnotated = true;
        } else {
            combined.set(item.folder, { ...item, hasRaw: false, hasAnnotated: true });
        }
    }

    return [...combined.values()];
}

async function listFrameFiles(rootDir, folderName, type) {
    const dirPath = path.join(rootDir, folderName);
    try {
        const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
        const files = await Promise.all(
            entries
                .filter((entry) => entry.isFile() && IMAGE_EXT_RE.test(entry.name))
                .map(async (entry) => {
                    const parsed = parseFrameFilename(entry.name);
                    const filePath = path.join(dirPath, entry.name);
                    const stat = await fsPromises.stat(filePath);

                    return {
                        filename: entry.name,
                        url: `/attendancemodule/frame-verification/image/${type}/${encodeURIComponent(folderName)}/${encodeURIComponent(entry.name)}`,
                        modifiedAt: stat.mtime.toISOString(),
                        sizeKB: Math.max(1, Math.round(stat.size / 1024)),
                        elapsedSec: parsed.elapsedSec,
                        camera: parsed.camera,
                        facesCount: parsed.facesCount,
                    };
                })
        );

        files.sort((a, b) => {
            const aElapsed = a.elapsedSec == null ? Number.MAX_SAFE_INTEGER : a.elapsedSec;
            const bElapsed = b.elapsedSec == null ? Number.MAX_SAFE_INTEGER : b.elapsedSec;
            if (aElapsed !== bElapsed) return aElapsed - bElapsed;

            const aCam = a.camera == null ? Number.MAX_SAFE_INTEGER : a.camera;
            const bCam = b.camera == null ? Number.MAX_SAFE_INTEGER : b.camera;
            if (aCam !== bCam) return aCam - bCam;

            return a.filename.localeCompare(b.filename);
        });

        return files;
    } catch (_) {
        return [];
    }
}

class FrameVerificationController {
    async getAvailability(req, res) {
        try {
            const room = req.query.room;
            if (!room) {
                return res.status(400).json({ error: 'room is required' });
            }

            const roomKey = normalizeRoom(room);
            const folders = await getCombinedFolders();
            const matches = folders.filter((folder) => folder.room === roomKey);

            const dates = [...new Set(matches.map((item) => item.date))]
                .filter(Boolean)
                .sort((a, b) => b.localeCompare(a));
            const periods = [...new Set(matches.map((item) => item.period))]
                .filter(Boolean)
                .sort(comparePeriods);

            res.json({
                room: roomKey,
                dates,
                periods,
                folders: matches
                    .sort((a, b) => {
                        if (a.date !== b.date) return b.date.localeCompare(a.date);
                        return comparePeriods(a.period, b.period);
                    })
                    .map((item) => ({
                        folder: item.folder,
                        date: item.date,
                        period: item.period,
                        hasRaw: item.hasRaw,
                        hasAnnotated: item.hasAnnotated,
                    })),
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getFrames(req, res) {
        try {
            const { room, date, period } = req.query;
            if (!room || !date || !period) {
                return res.status(400).json({ error: 'room, date, and period are required' });
            }

            const roomKey = normalizeRoom(room);
            const periodKey = normalizePeriod(period).toLowerCase();
            const dateDigits = normalizeDate(date);

            if (!/^\d{8}$/.test(dateDigits)) {
                return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
            }

            const folders = await getCombinedFolders();
            const match = folders.find((item) =>
                item.room === roomKey &&
                item.period === periodKey &&
                item.dateDigits === dateDigits
            );

            if (!match) {
                return res.json({
                    found: false,
                    folder: `${roomKey}_${normalizePeriod(period)}_${dateDigits}`,
                    room: roomKey,
                    period: periodKey,
                    date: formatDate(dateDigits),
                    rawFrames: [],
                    annotatedFrames: [],
                });
            }

            const [rawFrames, annotatedFrames] = await Promise.all([
                listFrameFiles(RAW_FRAMES_DIR, match.folder, 'raw'),
                listFrameFiles(ANNOTATED_FRAMES_DIR, match.folder, 'annotated'),
            ]);

            res.json({
                found: true,
                folder: match.folder,
                room: roomKey,
                period: match.period,
                date: match.date,
                rawFrames,
                annotatedFrames,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async serveImage(req, res) {
        try {
            const { type, folder, filename } = req.params;
            const safeFolder = decodeURIComponent(folder || '');
            const safeFilename = decodeURIComponent(filename || '');

            if (!['raw', 'annotated'].includes(type)) {
                return res.status(400).json({ error: 'Invalid image type' });
            }
            if (!parseFolderName(safeFolder)) {
                return res.status(400).json({ error: 'Invalid folder name' });
            }
            if (!safeFilename || safeFilename !== path.basename(safeFilename) || !IMAGE_EXT_RE.test(safeFilename)) {
                return res.status(400).json({ error: 'Invalid filename' });
            }

            const baseDir = type === 'raw' ? RAW_FRAMES_DIR : ANNOTATED_FRAMES_DIR;
            const filePath = path.join(baseDir, safeFolder, safeFilename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Image not found' });
            }

            res.sendFile(filePath);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = FrameVerificationController;

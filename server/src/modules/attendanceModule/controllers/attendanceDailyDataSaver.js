// Saves attendance results as JSON files in attendance-daily-data/ folder.
// One file per batch+date+slot, checks are appended on each call.
// This is the server-side persistence layer; the ml-service is stateless.

const fs   = require('fs');
const path = require('path');

const DAILY_DATA_DIR = path.join(__dirname, '..', 'attendance-daily-data');
if (!fs.existsSync(DAILY_DATA_DIR)) {
    fs.mkdirSync(DAILY_DATA_DIR, { recursive: true });
}

/**
 * Save one check result to the daily data file for this batch+date+slot.
 * @param {object} context  - { batch, date, slot, room, subject, faculty, semester, locksemId }
 * @param {object} mlResult - The JSON result from the ml-service (attendance, summary, unmatched_clusters)
 * @param {number} checkIndex
 */
function saveAttendanceDailyData(context, mlResult, checkIndex = 1) {
    try {
        const { batch, date, slot, room = '', subject = '', faculty = '', semester = '', locksemId = '' } = context;
        if (!batch || !date || !slot) return;

        const filename = `${date}_${batch}_${slot}.json`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const filepath = path.join(DAILY_DATA_DIR, filename);

        let record = {
            batch, date, slot, room, subject, faculty, semester, locksemId,
            lastUpdated: new Date().toISOString(),
            checks: [],
        };

        if (fs.existsSync(filepath)) {
            try {
                record = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                record.lastUpdated = new Date().toISOString();
            } catch (_) {}
        }

        record.checks.push({
            checkIndex,
            processedAt:      new Date().toISOString(),
            attendance:       mlResult.attendance       || {},
            summary:          mlResult.summary          || {},
            unmatched_clusters: mlResult.unmatched_clusters || [],
        });

        fs.writeFileSync(filepath, JSON.stringify(record, null, 2), 'utf8');
        console.log(`[DailyData] Saved check ${checkIndex} → ${filename}`);
    } catch (err) {
        console.error('[DailyData] Failed to save:', err.message);
    }
}

/**
 * List all saved daily data files.
 */
function listDailyDataFiles() {
    try {
        return fs.readdirSync(DAILY_DATA_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(DAILY_DATA_DIR, f), 'utf8'));
                    return { filename: f, batch: data.batch, date: data.date, slot: data.slot,
                             checks: data.checks.length, lastUpdated: data.lastUpdated };
                } catch (_) {
                    return { filename: f };
                }
            });
    } catch (_) {
        return [];
    }
}

/**
 * Read one daily data file by filename.
 */
function readDailyDataFile(filename) {
    const filepath = path.join(DAILY_DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return null;
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

module.exports = { saveAttendanceDailyData, listDailyDataFiles, readDailyDataFile, DAILY_DATA_DIR };

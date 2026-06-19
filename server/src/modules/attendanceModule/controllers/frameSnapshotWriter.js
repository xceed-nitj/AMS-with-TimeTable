// server/src/modules/attendanceModule/controllers/frameSnapshotWriter.js
//
// Persists "frame_snapshot" events emitted by the ML service (rtsp_routes.py
// _attendance_pipeline) to server/ml-data/. The ML service never writes to
// disk itself — it ships base64-encoded JPEG bytes over the network so it
// can run on a separate machine (e.g. a remote GPU box) from the Node
// server. This module is the single place that turns those bytes into
// files, used by both the sync attendance path (attendanceSessionController,
// autoAttendanceScheduler) and the live SSE path (mlRoutes).

const fs   = require('fs');
const path = require('path');

const SERVER_ROOT   = path.join(__dirname, '..', '..', '..', '..');
const RAW_DIR        = path.join(SERVER_ROOT, 'ml-data', 'frame_snapshots');
const ANNOTATED_DIR  = path.join(SERVER_ROOT, 'ml-data', 'annotated_frames');

/**
 * Persist one frame_snapshot event to disk and merge its face count into
 * the _faces.json sidecar (read-merge-write, since the same folder is
 * reused across multiple checks within a live session).
 * @param {object} snap { folder, filename, raw_data, annotated_data, faces_count }
 */
function saveFrameSnapshot(snap) {
    const { folder, filename, raw_data, annotated_data, faces_count } = snap || {};
    if (!folder || !filename) return;

    try {
        if (raw_data) {
            const rawDir = path.join(RAW_DIR, folder);
            fs.mkdirSync(rawDir, { recursive: true });
            fs.writeFileSync(path.join(rawDir, filename), Buffer.from(raw_data, 'base64'));
        }

        if (annotated_data) {
            const annotDir = path.join(ANNOTATED_DIR, folder);
            fs.mkdirSync(annotDir, { recursive: true });
            fs.writeFileSync(path.join(annotDir, filename), Buffer.from(annotated_data, 'base64'));

            const sidecarPath = path.join(annotDir, '_faces.json');
            let sidecar = {};
            if (fs.existsSync(sidecarPath)) {
                try { sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf8')); } catch (_) {}
            }
            sidecar[filename] = faces_count || 0;
            fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2));
        }
    } catch (err) {
        console.error(`[FrameSnapshot] Failed to save ${folder}/${filename}:`, err.message);
    }
}

function saveFrameSnapshots(snaps) {
    for (const snap of (snaps || [])) saveFrameSnapshot(snap);
}

module.exports = { saveFrameSnapshot, saveFrameSnapshots, RAW_DIR, ANNOTATED_DIR };

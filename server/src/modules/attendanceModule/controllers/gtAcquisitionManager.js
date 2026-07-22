// server/src/modules/attendanceModule/controllers/gtAcquisitionManager.js
//
// Server-persistent Ground Truth acquisition.
//
// The browser used to drive acquisition directly: it held the SSE connection
// to Python (via groundTruthRoutes.js), and Node wrote the image files as it
// consumed that stream. So closing/backgrounding the tab tore down the whole
// pipeline and acquisition stopped.
//
// This manager decouples the acquisition lifecycle from any browser
// connection. Node owns a background job that keeps consuming Python's SSE
// stream — writing files and tracking per-person counts — until an explicit
// stop or the 60-minute ceiling. Browsers only START a job, ATTACH to observe
// it (live SSE), and STOP it. Multiple users each run their own job
// concurrently; a job is identified by an acquisitionId. The registry lives in
// process memory, so a full server restart ends running jobs (acceptable).
//
// Camera cycling for Combined / Room modes runs here too: each camera is one
// "sub-run" bounded by maxDurationSec = the switch interval, so Python stops
// that camera cleanly (final clustering pass saved) and the loop advances to
// the next camera — persons accumulate on disk across sub-runs exactly as they
// did under the old browser-driven switching.

const axios      = require('axios');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');
const mongoose   = require('mongoose');

const ClusterMatch = require('../../../models/attendanceModule/clusterMatch');
const { buildExistingFoldersPayload } = require('./embeddingSyncHelper');
const { batchBelongsToDepartment }    = require('../middleware/attendanceAccess');

// The ML service may run on a separate machine — resolve from ML_SERVICE_URL,
// same as every other integration point.
const rawMlUrl       = process.env.ML_SERVICE_URL || 'http://localhost:8500';
const ML_SERVICE_URL = /^https?:\/\//i.test(rawMlUrl) ? rawMlUrl : `http://${rawMlUrl}`;

const GT_BASE_DIR = path.join(__dirname, '..', '..', '..', '..', 'ml-data', 'ground_truth');

// SSE event types Node handles server-side (writes to disk) instead of
// forwarding to the browser.
const GT_INTERNAL = new Set(['mkdir_batch', 'mkdir', 'crop_save', 'info_save', 'file_delete']);

const SWITCH_INTERVAL_SEC = 300;              // Combined/Room: seconds per camera
const MAX_DURATION_MS     = 60 * 60 * 1000;   // hard 60-minute ceiling
const GRACE_MS            = 5 * 60 * 1000;     // keep a finished job this long for late viewers
const LOG_MAX             = 120;

/** @type {Map<string, object>} acquisitionId -> Job */
const jobs = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Disk writer (relocated from groundTruthRoutes.js, unchanged behaviour) ───
// pythonFolderMap: person_XXX label -> MongoDB ObjectId string, one map per job
// so cluster labels stay consistent across camera switches / reconnects.
function handleGroundTruthEvent(event, batch, pythonFolderMap) {
    const batchDir = path.join(GT_BASE_DIR, batch);
    try {
        if (event.type === 'mkdir_batch') {
            fs.mkdirSync(batchDir, { recursive: true });

        } else if (event.type === 'mkdir') {
            fs.mkdirSync(path.join(batchDir, event.folder), { recursive: true });

            const oid    = new mongoose.Types.ObjectId();
            const oidStr = oid.toString();
            pythonFolderMap[event.folder] = oidStr;

            ClusterMatch.create({
                _id:           oid,
                batch,
                folderName:    event.folder,
                currentFolder: event.folder,
                status:        'unmatched',
                imageFiles:    [],
                imageCount:    0,
            }).catch((err) => {
                if (err.code !== 11000)
                    console.error('[GT] ClusterMatch create error:', err.message);
            });

        } else if (event.type === 'crop_save') {
            const folderPath = path.join(batchDir, event.folder);
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(path.join(folderPath, event.filename), Buffer.from(event.data, 'base64'));

            const oidStr = pythonFolderMap[event.folder];
            if (oidStr) {
                ClusterMatch.findByIdAndUpdate(oidStr, {
                    $addToSet: { imageFiles: event.filename },
                    $inc:      { imageCount: 1 },
                }).catch(() => {});
            }

        } else if (event.type === 'info_save') {
            const folderPath = path.join(batchDir, event.folder);
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(path.join(folderPath, '_info.json'), JSON.stringify(event.info, null, 2));

            const oidStr = pythonFolderMap[event.folder];
            if (oidStr && event.info) {
                const embeds  = event.info.embedding_files || [];
                const backups = event.info.backup_files    || [];
                const all     = [...embeds, ...backups];
                ClusterMatch.findByIdAndUpdate(oidStr, {
                    $set: { embeddingFiles: embeds, previewFiles: all.slice(0, 6) },
                }).catch(() => {});
            }

        } else if (event.type === 'file_delete') {
            const filePath = path.join(batchDir, event.folder, event.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`[GT] Error handling ${event.type} for ${batch}/${event.folder || ''}:`, err.message);
    }
}

// ─── Live-state helpers ───────────────────────────────────────────────────────
function pushLog(job, msg, color) {
    job.log.push({ time: new Date().toLocaleTimeString(), msg, color: color || '#ccc' });
    if (job.log.length > LOG_MAX) job.log.shift();
}

function broadcast(job, event) {
    const line = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of job.subscribers) {
        try { res.write(line); } catch { job.subscribers.delete(res); }
    }
}

function totals(job) {
    const persons = job.persons;
    const keys = Object.keys(persons);
    return {
        personCount: keys.length,
        doneCount:   keys.filter((k) => persons[k].done).length,
        totalImages: keys.reduce((s, k) => s + (persons[k].count || 0), 0),
    };
}

function summarize(job) {
    const t = totals(job);
    return {
        acquisitionId:     job.acquisitionId,
        mode:              job.mode,
        batch:             job.batch,
        status:            job.status,
        startedAt:         job.startedAt,
        elapsedSec:        Math.round((Date.now() - job.startedAt) / 1000),
        maxDurationSec:    Math.round(job.maxDurationMs / 1000),
        startedByName:     job.startedByName,
        activeCameraLabel: job.activeCameraLabel,
        pythonJobId:       job.pythonJobId,
        target:            job.params.targetImgsPerPerson || null,
        ...t,
    };
}

function snapshot(job) {
    return {
        type:              'snapshot',
        acquisitionId:     job.acquisitionId,
        mode:              job.mode,
        batch:             job.batch,
        status:            job.status,
        startedAt:         job.startedAt,
        elapsedSec:        Math.round((Date.now() - job.startedAt) / 1000),
        maxDurationSec:    Math.round(job.maxDurationMs / 1000),
        persons:           job.persons,
        target:            job.params.targetImgsPerPerson || null,
        activeCameraLabel: job.activeCameraLabel,
        pythonJobId:       job.pythonJobId,
        summary:           job.summary,
        log:               job.log.slice(-LOG_MAX),
    };
}

// ─── Stream consumption ───────────────────────────────────────────────────────
function consumeEvent(job, event) {
    if (!event || !event.type) return;

    if (GT_INTERNAL.has(event.type)) {
        handleGroundTruthEvent(event, job.batch, job.pythonFolderMap);
        return;
    }

    switch (event.type) {
        case 'job_id':
            job.pythonJobId = event.jobId;
            broadcast(job, { type: 'job_id', jobId: event.jobId });
            // A stop that arrived before this sub-run had a jobId — honour it now.
            if (job.stopRequested) stopPython(job);
            break;

        case 'person_update':
            job.persons[event.person_id] = { count: event.count, done: !!event.done };
            broadcast(job, event);
            break;

        case 'done':
            // Sub-run summary only — the job-level 'done' is emitted by
            // finalizeJob when the whole acquisition ends.
            job._lastSub = event;
            break;

        case 'stage':
        case 'progress':
            if (event.message) pushLog(job, event.message, '#aaa');
            broadcast(job, event);
            break;

        case 'gt_config_seeded':
            // Python filled omitted knobs from the ML Fine Tuning GT config —
            // log it (amber) so it lands in snapshots, and forward it so the
            // page can show a notification.
            if (event.message) pushLog(job, event.message, '#f0c040');
            broadcast(job, event);
            break;

        case 'error':
            if (event.message) pushLog(job, event.message, '#ef4444');
            broadcast(job, event);
            break;

        case 'ping':
            break;

        default:
            // frame + anything else — forward for the live view, don't log.
            broadcast(job, event);
    }
}

// Clean stop of the CURRENT Python sub-run by its specific jobId, so it runs
// its final clustering/save pass. Never stops with an empty jobId (that would
// stop every user's job in the ML service).
async function stopPython(job) {
    if (!job.pythonJobId) return;   // will be stopped from the job_id handler
    try {
        await axios.post(`${ML_SERVICE_URL}/stop-rtsp-stream`,
            { jobId: job.pythonJobId }, { timeout: 10000 });
    } catch (_) { /* best-effort */ }
}

// One camera run. Resolves when Python's SSE stream ends (its own maxDurationSec
// elapsed → clean stop, or an explicit stop, or an error).
function runSubRun(job, camera, subDeadlineMs) {
    return new Promise((resolve) => {
        const remainingSec = Math.max(5, Math.floor((subDeadlineMs - Date.now()) / 1000));
        let existingFolders = [];
        try { existingFolders = buildExistingFoldersPayload(path.join(GT_BASE_DIR, job.batch)); }
        catch (_) { existingFolders = []; }

        const body = {
            rtspUrl:             camera.url,
            batch:               job.batch,
            detSize:             job.params.detSize,
            frameSkip:           job.params.frameSkip,
            targetImgsPerPerson: job.params.targetImgsPerPerson,
            minSamples:          job.params.minSamples,
            clusterThreshold:    job.params.clusterThreshold,
            continuous:          true,
            maxDurationSec:      remainingSec,
            jobId:               '',
            existingFolders,
        };

        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            job.currentStream = null;
            job.pythonJobId   = null;
            resolve();
        };

        axios.post(`${ML_SERVICE_URL}/extract-rtsp-stream`, body, {
            responseType: 'stream',
            timeout:      0,
            headers:      { 'Content-Type': 'application/json' },
        }).then((pyRes) => {
            job.currentStream = pyRes.data;
            if (job.stopRequested) stopPython(job);

            let buffer = '';
            pyRes.data.on('data', (chunk) => {
                buffer += chunk.toString();
                let b;
                while ((b = buffer.indexOf('\n\n')) !== -1) {
                    const eventText = buffer.substring(0, b + 2);
                    buffer = buffer.substring(b + 2);
                    const dataLine = eventText.trimEnd();
                    if (!dataLine.startsWith('data: ')) continue;
                    let event = null;
                    try { event = JSON.parse(dataLine.slice(6)); } catch (_) { continue; }
                    consumeEvent(job, event);
                }
            });
            pyRes.data.on('end', finish);
            pyRes.data.on('error', (e) => {
                pushLog(job, `⚠ Stream error: ${e.message}`, '#f59e0b');
                finish();
            });
        }).catch((err) => {
            pushLog(job, `❌ ML service connect failed: ${err.message}`, '#ef4444');
            finish();
        });
    });
}

async function runAcquisition(job) {
    const deadline  = job.startedAt + job.maxDurationMs;
    const isCycling = job.mode !== 'single';
    let idx = 0;

    try {
        while (!job.stopRequested && Date.now() < deadline && job.cameras.length) {
            const cam = job.cameras[idx % job.cameras.length];
            job.activeCameraIdx   = idx % job.cameras.length;
            job.activeCameraLabel = cam.label;

            if (isCycling) {
                pushLog(job, `🔄 Switching to ${cam.label}`, '#f0c040');
                broadcast(job, {
                    type: 'camera_switch',
                    activeCameraLabel: cam.label,
                    activeCameraIdx:   job.activeCameraIdx,
                });
            } else {
                pushLog(job, `▶ Acquiring from ${cam.label}`, '#38bdf8');
            }

            const subDeadline = isCycling
                ? Math.min(deadline, Date.now() + job.switchIntervalSec * 1000)
                : deadline;

            await runSubRun(job, cam, subDeadline);

            if (job.stopRequested) break;

            if (isCycling) {
                idx++;
            } else {
                // Single camera: the sub-run ends only when the 60-min ceiling
                // is reached (clean finish) or the stream dropped past Python's
                // internal reconnects. If time remains, reconnect and continue.
                if (Date.now() >= deadline) break;
                pushLog(job, '⚠ Stream ended early — reconnecting…', '#f59e0b');
                await sleep(5000);
            }
        }
    } catch (err) {
        job.status = 'error';
        job.error  = err.message;
        pushLog(job, `❌ ${err.message}`, '#ef4444');
    }

    finalizeJob(job);
}

function finalizeJob(job) {
    if (job.status !== 'error') job.status = 'done';
    const t = totals(job);
    job.summary = {
        peopleDetected: t.personCount,
        imagesSaved:    t.totalImages,
        elapsedSec:     Math.round((Date.now() - job.startedAt) / 1000),
        batchDir:       path.posix.join('ground_truth', job.batch),
    };
    pushLog(job, `✅ Finished — ${t.personCount} people, ${t.totalImages} images`, '#22c55e');
    broadcast(job, {
        type:            'done',
        status:          job.status,
        ...job.summary,
        message:         `Acquisition finished — ${t.personCount} people, ${t.totalImages} images`,
    });
    job.currentStream = null;
    // Close the currently-attached live feeds — the job is over, no more events
    // will come. A page opened during the grace window still gets the final
    // state from the one-shot `snapshot` in attachStream.
    for (const res of job.subscribers) {
        try { res.end(); } catch (_) { /* already closed */ }
    }
    job.subscribers.clear();
    // Keep the finished job briefly so a page opened just after it ended still
    // sees the final result, then drop it from the registry.
    setTimeout(() => { jobs.delete(job.acquisitionId); }, GRACE_MS);
}

// ─── Public API ───────────────────────────────────────────────────────────────
function startAcquisition({ mode, batch, cameras, params, startedByName, department }) {
    const acquisitionId = crypto.randomUUID();
    const job = {
        acquisitionId,
        mode:              mode || 'single',
        batch,
        params:            params || {},
        cameras:           Array.isArray(cameras) ? cameras : [],
        switchIntervalSec: SWITCH_INTERVAL_SEC,
        maxDurationMs:     MAX_DURATION_MS,
        startedByName:     startedByName || 'unknown',
        department:        department || null,
        startedAt:         Date.now(),
        status:            'running',
        persons:           {},
        activeCameraIdx:   0,
        activeCameraLabel: (cameras && cameras[0] && cameras[0].label) || '',
        pythonJobId:       null,
        summary:           null,
        error:             null,
        log:               [],
        subscribers:       new Set(),
        currentStream:     null,
        stopRequested:     false,
        pythonFolderMap:   {},
    };
    jobs.set(acquisitionId, job);
    pushLog(job, `Acquisition started (${job.mode}) — ${job.cameras.length} camera(s)`, '#38bdf8');
    runAcquisition(job);   // fire-and-forget; runs independent of any browser
    return { acquisitionId };
}

function attachStream(acquisitionId, res) {
    const job = jobs.get(acquisitionId);
    if (!job) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Acquisition not found or expired' })}\n\n`);
        res.end();
        return;
    }
    res.write(`data: ${JSON.stringify(snapshot(job))}\n\n`);
    job.subscribers.add(res);
    res.on('close', () => job.subscribers.delete(res));
}

async function stopAcquisition(acquisitionId) {
    const job = jobs.get(acquisitionId);
    if (!job) return { ok: false, error: 'Acquisition not found' };
    job.stopRequested = true;
    if (job.status === 'running') job.status = 'stopping';
    pushLog(job, '⏹ Stop requested — finishing final save…', '#9ca3af');
    broadcast(job, { type: 'stage', message: 'Stopping — finishing final save…' });
    await stopPython(job);
    return { ok: true };
}

function listJobs({ department, fullAccess } = {}) {
    const out = [];
    for (const job of jobs.values()) {
        if (!fullAccess && department && !batchBelongsToDepartment(job.batch, department)) continue;
        out.push(summarize(job));
    }
    return out.sort((a, b) => b.startedAt - a.startedAt);
}

module.exports = {
    startAcquisition,
    attachStream,
    stopAcquisition,
    listJobs,
    // exported so the legacy /extract-rtsp-stream route can share the writer
    handleGroundTruthEvent,
    GT_INTERNAL,
};

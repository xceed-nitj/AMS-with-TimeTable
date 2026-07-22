const axios = require('axios');
const net = require('net');
const Camera = require('../../../models/attendanceModule/camera.js');
const MasterRoom = require('../../../models/masterroom.js');
const { spawn } = require("child_process");

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';

const ALLOWED_UPDATE_FIELDS = [
    'cameraId',
    'roomId',
    'building',
    'position',
    'pairedWith',
    'streamUrl',
    'protocol',
    'ipAddress',
    'port',
    'resolution',
    'fps',
    'isActive',
    'lastHeartbeat',
    'status',
];

function pickAllowedUpdates(payload = {}) {
    return Object.fromEntries(
        Object.entries(payload).filter(([key]) => ALLOWED_UPDATE_FIELDS.includes(key))
    );
}

function escapeRegex(value = '') {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePatch(patch = {}) {
    const out = { ...patch };
    if (out.cameraId !== undefined) out.cameraId = String(out.cameraId).trim().toUpperCase();
    if (out.roomId !== undefined) out.roomId = String(out.roomId).trim().toUpperCase();
    if (out.pairedWith !== undefined) out.pairedWith = String(out.pairedWith).trim().toUpperCase();
    return out;
}

function normalizeRoom(value = '') {
    return String(value).trim().replace(/[\s\-.]+/g, '').toUpperCase();
}

// Checks for online status of streams | same stuff as ffprobe command
// Resolves true (stream ok), false (unreachable / no stream), or null when
// ffprobe itself is not installed on this host (caller should fall back to a
// TCP reachability check instead of reporting every camera offline).
function probeRtsp(rtspUrl, timeoutMs = 12000) {
    return new Promise((resolve) => {
        const ffprobe = spawn("ffprobe", [
            "-v", "error",
            "-rtsp_transport", "tcp",
            // RTSP socket I/O timeout in microseconds — without this, a dropped
            // packet or unreachable host makes ffprobe hang far past any sane
            // window and the outer kill timer marks an online camera offline.
            "-timeout", "8000000",
            "-show_entries", "stream=codec_type",
            "-of", "default=noprint_wrappers=1:nokey=1",
            rtspUrl,
        ]);

        let finished = false;

        const timer = setTimeout(() => {
            if (!finished) {
                finished = true;
                ffprobe.kill("SIGKILL");
                resolve(false);
            }
        }, timeoutMs);

        ffprobe.on("close", (code) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            resolve(code === 0);
        });

        ffprobe.on("error", (err) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            // ENOENT = ffprobe binary missing on this host, not a camera fault
            resolve(err && err.code === 'ENOENT' ? null : false);
        });
    });
}

// Doesnt correctly tell if stream is running or not as only checks for a TCP connection which is open when mediamtx is running regardless of stream status
function probeTcpReachability(host, port, timeoutMs = 1200) {
    return new Promise((resolve) => {
        if (!host || !Number.isFinite(Number(port))) {
            resolve(false);
            return;
        }

        const socket = new net.Socket();
        let settled = false;

        const finish = (online) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            resolve(Boolean(online));
        };

        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));

        try {
            socket.connect(Number(port), String(host));
        } catch (_) {
            finish(false);
        }
    });
}

async function resolveBuildingForRoom(roomId) {
    if (!roomId) return null;

    const roomTrimmed = String(roomId).trim();
    const direct = await MasterRoom.findOne({ room: { $regex: new RegExp(`^${escapeRegex(roomTrimmed)}$`, 'i') } })
        .select('room building')
        .lean();
    if (direct?.building) return direct.building;

    const allRooms = await MasterRoom.find({}, 'room building').lean();
    const wanted = normalizeRoom(roomTrimmed);
    const found = allRooms.find((r) => normalizeRoom(r.room) === wanted);
    return found?.building || null;
}

class CameraController {
    async createCamera(req, res) {
        try {
            const payload = pickAllowedUpdates(req.body);
            const normalizedPayload = normalizePatch(payload);
            if (!normalizedPayload.roomId) {
                return res.status(400).json({ error: 'roomId is required' });
            }

            const building = await resolveBuildingForRoom(normalizedPayload.roomId);
            if (!building) {
                return res.status(400).json({ error: 'No building found for given roomId in room collection' });
            }

            normalizedPayload.building = building;
            const created = await Camera.create(normalizedPayload);
            return res.status(201).json(created);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async listCameras(req, res) {
        try {
            const { roomId, status, isActive, liveStatus } = req.query;
            const query = {};
            const shouldProbeLive = String(liveStatus).toLowerCase() === 'true';

            if (roomId) query.roomId = String(roomId).trim().toUpperCase();

            if (!shouldProbeLive) {
                if (status) query.status = status;
                if (isActive !== undefined) query.isActive = String(isActive).toLowerCase() === 'true';
            }

            const cameras = await Camera.find(query).sort({ roomId: 1, position: 1, cameraId: 1 }).lean();

            if (!shouldProbeLive) {
                return res.json(cameras);
            }

            const checkedAt = new Date().toISOString();
            const evaluated = await Promise.all(
                cameras.map(async (camera) => {
                    let online = await probeRtsp(camera.streamUrl);
                    if (online === null) {
                        // ffprobe is not installed on this host — fall back to a
                        // plain TCP reachability check rather than marking every
                        // camera offline.
                        online = await probeTcpReachability(camera.ipAddress, camera.port);
                    }
                    return {
                        ...camera,
                        status: online ? 'online' : 'offline',
                        isActive: Boolean(online),
                        availabilityCheckedAt: checkedAt,
                    };
                })
            );

            let filtered = evaluated;
            if (status) filtered = filtered.filter((camera) => camera.status === status);
            if (isActive !== undefined) {
                const activeWanted = String(isActive).toLowerCase() === 'true';
                filtered = filtered.filter((camera) => Boolean(camera.isActive) === activeWanted);
            }

            return res.json(filtered);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async listCameraRooms(req, res) {
        try {
            const roomIds = await Camera.distinct('roomId');
            const rooms = roomIds
                .map((roomId) => String(roomId || '').trim().toUpperCase())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));

            return res.json({ rooms });
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async getCameraById(req, res) {
        try {
            const { id } = req.params;
            const camera = await Camera.findById(id);
            if (!camera) return res.status(404).json({ error: 'Camera not found' });
            return res.json(camera);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async getCameraByCameraId(req, res) {
        try {
            const { cameraId } = req.params;
            const camera = await Camera.findOne({ cameraId: String(cameraId).trim().toUpperCase() });
            if (!camera) return res.status(404).json({ error: 'Camera not found' });
            return res.json(camera);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async updateCameraById(req, res) {
        try {
            const { id } = req.params;
            const updates = normalizePatch(pickAllowedUpdates(req.body));

            if (!Object.keys(updates).length) {
                return res.status(400).json({ error: 'No valid fields provided for update' });
            }

            if (updates.roomId !== undefined) {
                const building = await resolveBuildingForRoom(updates.roomId);
                if (!building) {
                    return res.status(400).json({ error: 'No building found for given roomId in room collection' });
                }
                updates.building = building;
            }

            const updated = await Camera.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Camera not found' });
            }

            return res.json(updated);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async updateCameraByCameraId(req, res) {
        try {
            const { cameraId } = req.params;
            const updates = normalizePatch(pickAllowedUpdates(req.body));

            if (!Object.keys(updates).length) {
                return res.status(400).json({ error: 'No valid fields provided for update' });
            }

            if (updates.roomId !== undefined) {
                const building = await resolveBuildingForRoom(updates.roomId);
                if (!building) {
                    return res.status(400).json({ error: 'No building found for given roomId in room collection' });
                }
                updates.building = building;
            }

            const updated = await Camera.findOneAndUpdate(
                { cameraId: String(cameraId).toUpperCase() },
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Camera not found' });
            }

            return res.json(updated);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async updateCameraHealth(req, res) {
        try {
            const { id } = req.params;
            const { status, lastHeartbeat } = req.body;

            const patch = {};
            if (status !== undefined) patch.status = status;
            if (lastHeartbeat !== undefined) patch.lastHeartbeat = lastHeartbeat;

            if (!Object.keys(patch).length) {
                return res.status(400).json({ error: 'status or lastHeartbeat required' });
            }

            const updated = await Camera.findByIdAndUpdate(
                id,
                { $set: patch },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Camera not found' });
            }

            return res.json(updated);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async deleteCameraById(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Camera.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ error: 'Camera not found' });
            return res.json({ deleted: true, id: deleted._id, cameraId: deleted.cameraId });
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async startPreviewById(req, res) {
        try {
            const { id } = req.params;
            const camera = await Camera.findById(id);
            if (!camera) return res.status(404).json({ error: 'Camera not found' });

            const result = await axios.post(
                `${ML_URL}/start-preview`,
                { rtspUrl: camera.streamUrl },
                { timeout: 15000 }
            );

            return res.json({
                status: 'ok',
                jobId: result.data?.jobId,
                previewCamera: {
                    id: camera._id,
                    cameraId: camera.cameraId,
                    roomId: camera.roomId,
                    streamUrl: camera.streamUrl,
                },
                ml: result.data,
            });
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                return res.status(502).json({
                    error: `ML preview service is not reachable at ${ML_URL}. Start python-ml-service on port 8500, then try again.`,
                });
            }
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                return res.status(504).json({
                    error: 'ML preview service timed out while starting the RTSP preview. Check whether the camera IP/port is reachable from this machine.',
                });
            }
            if (error.response?.data) {
                return res.status(error.response.status || 500).json({
                    error: error.response.data.detail || error.response.data.error || error.response.data.message || error.message,
                });
            }
            return sendKnownError(res, error);
        }
    }

    async proxyPreviewStream(req, res) {
        try {
            const result = await axios.get(`${ML_URL}/rtsp-preview`, {
                responseType: 'stream',
                timeout: 0,
                params: {
                    jobId: req.query.jobId,
                    quality: req.query.quality,
                    scale: req.query.scale,
                },
            });

            res.setHeader('Content-Type', result.headers['content-type'] || 'multipart/x-mixed-replace; boundary=frame');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('X-Accel-Buffering', 'no');
            result.data.pipe(res);
            result.data.on('error', () => { if (!res.writableEnded) res.end(); });
            req.on('close', () => result.data.destroy());
        } catch (error) {
            return sendKnownError(res, error);
        }
    }

    async stopPreview(req, res) {
        try {
            const jobId = req.body?.jobId;
            const result = await axios.post(
                `${ML_URL}/stop-preview`,
                jobId ? { jobId } : {},
                { timeout: 10000 },
            );
            return res.json(result.data);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }
    async startRecording(req, res) {
    const { rtspUrl, label, format } = req.body;
    if (!rtspUrl || !label)
        return res.status(400).json({ error: 'rtspUrl and label required' });
    try {
        const result = await axios.post(`${ML_URL}/start-recording`,
            { rtspUrl, label, format }, { timeout: 10000 });
        return res.json(result.data);
    } catch (error) {
        return sendKnownError(res, error);
    }
}

async stopRecording(req, res) {
    const { recordingId } = req.body;
    if (!recordingId)
        return res.status(400).json({ error: 'recordingId required' });
    try {
        const result = await axios.post(`${ML_URL}/stop-recording`,
            { recordingId }, { timeout: 15000 });
        return res.json(result.data);
    } catch (error) {
        return sendKnownError(res, error);
    }
}

async listRecordings(req, res) {
    try {
        const result = await axios.get(`${ML_URL}/recordings`, { timeout: 8000 });
        return res.json(result.data);
    } catch (error) {
        return sendKnownError(res, error);
    }
}

async downloadRecording(req, res) {
    // The recording lives on the ML service's own disk (it's the process that
    // ran ffmpeg), not Node's — stream the bytes from there rather than
    // assuming a local copy exists.
    const path = require('path');
    const safe = path.basename(req.params.filename);
    try {
        const upstream = await axios.get(
            `${ML_URL}/recordings/${encodeURIComponent(safe)}/download`,
            { responseType: 'stream', timeout: 30000 },
        );
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
        upstream.data.pipe(res);
    } catch (error) {
        if (error.response?.status === 404) return res.status(404).json({ error: 'File not found' });
        return sendKnownError(res, error);
    }
}

async downloadAudio(req, res) {
    // Audio is extracted by ffmpeg on the ML service's machine (where the
    // video actually is), then streamed here — Node no longer assumes ffmpeg
    // or the video file exist locally.
    const path = require('path');
    const safe = path.basename(req.params.filename);
    try {
        const upstream = await axios.get(
            `${ML_URL}/recordings/${encodeURIComponent(safe)}/audio`,
            { responseType: 'stream', timeout: 30000 },
        );
        const audioName = safe.replace(/\.mp4$/, '.mp3');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${audioName}"`);
        upstream.data.pipe(res);
    } catch (error) {
        if (error.response?.status === 404) return res.status(404).json({ error: 'File not found' });
        return sendKnownError(res, error);
    }
}
// ── Scheduled recording methods ────────────────────────────────────────────
// In-memory store (survives server restart as long as the process runs;
// for persistence across restarts you could move this to MongoDB later).
// Key: scheduleId (uuid), Value: { scheduleId, rtspUrl, label, period,
//   scheduledDate, startMin, endMin, status, activeRecordingId, timers[] }

scheduleRecording(req, res) {
    const { rtspUrl, label, period, scheduledDate, format } = req.body;
    if (!rtspUrl || !label || !period || !scheduledDate)
        return res.status(400).json({ error: 'rtspUrl, label, period and scheduledDate are required' });

    const SLOT_SCHEDULE = {
        period1: { startMin: 8 * 60 + 30,  endMin: 9 * 60 + 30  },
        period2: { startMin: 9 * 60 + 30,  endMin: 10 * 60 + 30 },
        period3: { startMin: 10 * 60 + 30, endMin: 11 * 60 + 30 },
        period4: { startMin: 11 * 60 + 30, endMin: 12 * 60 + 30 },
        period5: { startMin: 13 * 60 + 30, endMin: 14 * 60 + 30 },
        period6: { startMin: 14 * 60 + 30, endMin: 15 * 60 + 30 },
        period7: { startMin: 15 * 60 + 30, endMin: 16 * 60 + 30 },
        period8: { startMin: 16 * 60 + 30, endMin: 17 * 60 + 30 },
    };

    const slot = SLOT_SCHEDULE[period];
    if (!slot) return res.status(400).json({ error: `Unknown period: ${period}` });

    const scheduleId = require('crypto').randomUUID();
    const entry = {
        scheduleId,
        rtspUrl,
        label,
        period,
        scheduledDate,     // "YYYY-MM-DD"
        startMin: slot.startMin,
        endMin:   slot.endMin,
        status:   'scheduled',
        format:   format || 'video+audio',
        activeRecordingId: null,
        timers: [],
    };

    // Calculate ms until start and stop from now
    const now = new Date();
    const target = new Date(scheduledDate);
    target.setHours(Math.floor(slot.startMin / 60), slot.startMin % 60, 0, 0);
    const msUntilStart = target - now;

    const targetEnd = new Date(scheduledDate);
    targetEnd.setHours(Math.floor(slot.endMin / 60), slot.endMin % 60, 0, 0);
    const msUntilEnd = targetEnd - now;

    if (msUntilStart < 0) {
        return res.status(400).json({ error: 'Scheduled time is in the past' });
    }

    // Auto-start timer
    const startTimer = setTimeout(async () => {
        try {
            const axios = require('axios');
            const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
            const result = await axios.post(`${ML_URL}/start-recording`,
                { rtspUrl, label, format: entry.format }, { timeout: 10000 });
            entry.activeRecordingId = result.data.recordingId;
            entry.status = 'recording';
            console.log(`[RecordScheduler] Auto-started recording for ${label} period=${period} id=${entry.activeRecordingId}`);
        } catch (err) {
            entry.status = 'error';
            console.error(`[RecordScheduler] Failed to auto-start recording for ${label}:`, err.message);
        }
    }, msUntilStart);

    // Auto-stop timer
    const stopTimer = setTimeout(async () => {
        if (!entry.activeRecordingId) return;
        try {
            const axios = require('axios');
            const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8500';
            await axios.post(`${ML_URL}/stop-recording`,
                { recordingId: entry.activeRecordingId }, { timeout: 15000 });
            entry.status = 'done';
            entry.activeRecordingId = null;
            console.log(`[RecordScheduler] Auto-stopped recording for ${label} period=${period}`);
        } catch (err) {
            console.error(`[RecordScheduler] Failed to auto-stop recording for ${label}:`, err.message);
        }
    }, msUntilEnd);

    entry.timers = [startTimer, stopTimer];

    // Store in module-level map (defined below the class)
    _schedules.set(scheduleId, entry);

    return res.status(201).json({
        scheduleId,
        label,
        period,
        scheduledDate,
        startTime: `${String(Math.floor(slot.startMin / 60)).padStart(2,'0')}:${String(slot.startMin % 60).padStart(2,'0')}`,
        endTime:   `${String(Math.floor(slot.endMin / 60)).padStart(2,'0')}:${String(slot.endMin % 60).padStart(2,'0')}`,
        status: 'scheduled',
    });
}

listScheduledRecordings(req, res) {
    const list = [..._schedules.values()].map(e => ({
        scheduleId: e.scheduleId,
        label:      e.label,
        period:     e.period,
        scheduledDate: e.scheduledDate,
        startTime: `${String(Math.floor(e.startMin / 60)).padStart(2,'0')}:${String(e.startMin % 60).padStart(2,'0')}`,
        endTime:   `${String(Math.floor(e.endMin / 60)).padStart(2,'0')}:${String(e.endMin % 60).padStart(2,'0')}`,
        status:    e.status,
        format:    e.format || 'video+audio',
        activeRecordingId: e.activeRecordingId,
    }));
    return res.json(list);
}

cancelScheduledRecording(req, res) {
    const { scheduleId } = req.params;
    const entry = _schedules.get(scheduleId);
    if (!entry) return res.status(404).json({ error: 'Schedule not found' });
    // Clear both timers
    entry.timers.forEach(t => clearTimeout(t));
    _schedules.delete(scheduleId);
    return res.json({ deleted: true, scheduleId });
}
}

// Module-level map for scheduled recordings (shared across all requests)
const _schedules = new Map();

function sendKnownError(res, error) {
    if (error.code === 11000) {
        return res.status(409).json({ error: 'Duplicate key error', details: error.keyValue });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
        return res.status(400).json({ error: error.message });
    }
    // Forward the real upstream status/message when this was an axios call
    // to the ML service that came back with a non-2xx response, instead of
    // flattening every such case to a generic 500 (which previously hid,
    // e.g., a genuine 503/504 from the ML service behind an unhelpful
    // "Request failed with status code 503" 500 response).
    if (error.response) {
        const detail = error.response.data?.detail || error.response.data?.error || error.response.data?.message;
        return res.status(error.response.status || 500).json({ error: detail || error.message });
    }
    return res.status(500).json({ error: error.message });
}

module.exports = new CameraController();

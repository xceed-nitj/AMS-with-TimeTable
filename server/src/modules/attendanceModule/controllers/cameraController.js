const axios = require('axios');
const net = require('net');
const Camera = require('../../../models/attendanceModule/camera.js');
const MasterRoom = require('../../../models/masterroom.js');

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
                    const online = await probeTcpReachability(camera.ipAddress, camera.port);
                    return {
                        ...camera,
                        status: online ? 'online' : 'offline',
                        isActive: online,
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
            const result = await axios.post(`${ML_URL}/stop-rtsp-stream`, {}, { timeout: 10000 });
            return res.json(result.data);
        } catch (error) {
            return sendKnownError(res, error);
        }
    }
}
function sendKnownError(res, error) {
    if (error.code === 11000) {
        return res.status(409).json({ error: 'Duplicate key error', details: error.keyValue });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
        return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
}

module.exports = new CameraController();

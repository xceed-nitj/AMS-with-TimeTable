const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/cameraController');

// ── Recording routes MUST come before /:id ─────────────────────────────────
// Express matches top-to-bottom. If /:id is declared first, GET /recording/list
// hits it with id="list" and never reaches listRecordings. Same for download/audio.
router.post('/recording/start',                (req, res) => cameraController.startRecording(req, res));
router.post('/recording/stop',                 (req, res) => cameraController.stopRecording(req, res));
router.get('/recording/list',                  (req, res) => cameraController.listRecordings(req, res));
router.get('/recording/download/:filename',    (req, res) => cameraController.downloadRecording(req, res));
router.get('/recording/audio/:filename',       (req, res) => cameraController.downloadAudio(req, res));

// ── Scheduled recording routes ─────────────────────────────────────────────
router.post('/recording/schedule',             (req, res) => cameraController.scheduleRecording(req, res));
router.get('/recording/schedule',              (req, res) => cameraController.listScheduledRecordings(req, res));
router.delete('/recording/schedule/:scheduleId', (req, res) => cameraController.cancelScheduledRecording(req, res));

// ── Static named routes ────────────────────────────────────────────────────
router.post('/', (req, res) => cameraController.createCamera(req, res));
router.get('/', (req, res) => cameraController.listCameras(req, res));
router.get('/rooms', (req, res) => cameraController.listCameraRooms(req, res));
router.get('/preview/stream', (req, res) => cameraController.proxyPreviewStream(req, res));
router.post('/preview/stop', (req, res) => cameraController.stopPreview(req, res));
router.get('/by-camera-id/:cameraId', (req, res) => cameraController.getCameraByCameraId(req, res));
router.patch('/by-camera-id/:cameraId', (req, res) => cameraController.updateCameraByCameraId(req, res));
router.put('/by-camera-id/:cameraId', (req, res) => cameraController.updateCameraByCameraId(req, res));

// ── Dynamic /:id routes LAST ───────────────────────────────────────────────
router.get('/:id', (req, res) => cameraController.getCameraById(req, res));
router.patch('/:id', (req, res) => cameraController.updateCameraById(req, res));
router.put('/:id', (req, res) => cameraController.updateCameraById(req, res));
router.patch('/:id/health', (req, res) => cameraController.updateCameraHealth(req, res));
router.post('/:id/preview/start', (req, res) => cameraController.startPreviewById(req, res));
router.delete('/:id', (req, res) => cameraController.deleteCameraById(req, res));

module.exports = router;

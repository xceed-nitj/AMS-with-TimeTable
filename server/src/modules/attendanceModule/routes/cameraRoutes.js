const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/cameraController');

router.post('/', (req, res) => cameraController.createCamera(req, res));
router.get('/', (req, res) => cameraController.listCameras(req, res));
router.get('/preview/stream', (req, res) => cameraController.proxyPreviewStream(req, res));
router.post('/preview/stop', (req, res) => cameraController.stopPreview(req, res));
router.get('/by-camera-id/:cameraId', (req, res) => cameraController.getCameraByCameraId(req, res));
router.patch('/by-camera-id/:cameraId', (req, res) => cameraController.updateCameraByCameraId(req, res));
router.put('/by-camera-id/:cameraId', (req, res) => cameraController.updateCameraByCameraId(req, res));
router.get('/:id', (req, res) => cameraController.getCameraById(req, res));
router.patch('/:id', (req, res) => cameraController.updateCameraById(req, res));
router.put('/:id', (req, res) => cameraController.updateCameraById(req, res));
router.patch('/:id/health', (req, res) => cameraController.updateCameraHealth(req, res));
router.post('/:id/preview/start', (req, res) => cameraController.startPreviewById(req, res));
router.delete('/:id', (req, res) => cameraController.deleteCameraById(req, res));

module.exports = router;

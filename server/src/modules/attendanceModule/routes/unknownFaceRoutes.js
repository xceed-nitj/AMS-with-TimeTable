const express = require('express');
const router = express.Router();
const unknownFaceController = require('../controllers/unknownFaceController');

// Settings
router.get('/settings', unknownFaceController.getSettings);
router.put('/settings', unknownFaceController.updateSettings);

// Clusters
router.get('/', unknownFaceController.getAll);
router.get('/image/*', unknownFaceController.getImage);
router.get('/cluster/*/download', unknownFaceController.downloadCluster);
router.put('/cluster/*/status', unknownFaceController.updateStatus);
router.put('/cluster/*/rollno', unknownFaceController.updateRollNo);
router.delete('/cluster/*', unknownFaceController.deleteCluster);

module.exports = router;

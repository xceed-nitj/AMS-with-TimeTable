// server/src/modules/attendanceModule/routes/rollAssignRoutes.js

const express = require('express');
const router  = express.Router();
const RollAssignController = require('../controllers/rollAssignController');

const controller = new RollAssignController();

// List unassigned (person_XXX) and assigned folders
router.get('/clusters/:batch', async (req, res) => {
    try { await controller.listClusters(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Serve a face-crop photo from any ground_truth subfolder
router.get('/photo/:batch/:folder/:filename', async (req, res) => {
    try { await controller.servePhoto(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Serve an ERP photo
router.get('/erp-photo/:filename', async (req, res) => {
    try { await controller.serveErpPhoto(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Auto-match clusters against ERP photos (calls Python ML service)
router.post('/auto-match/:batch', async (req, res) => {
    try { await controller.autoMatch(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Approve: rename person_XXX → rollNo
router.post('/assign', async (req, res) => {
    try { await controller.assignRollNo(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Bulk approve
router.post('/bulk-assign', async (req, res) => {
    try { await controller.bulkAssign(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Flag a cluster as incorrect match
router.post('/flag', async (req, res) => {
    try { await controller.flagCluster(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// List all open (unresolved) flags for a batch
router.get('/flagged/:batch', async (req, res) => {
    try { await controller.listFlagged(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Resolve a flag with correct roll number
router.post('/resolve-flag', async (req, res) => {
    try { await controller.resolveFlag(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

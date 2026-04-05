// server/src/modules/attendanceModule/routes/rollAssignRoutes.js

const express    = require('express');
const router     = express.Router();
const RollAssignController = require('../controllers/rollAssignController');

const ctrl = new RollAssignController();
const wrap = (fn) => async (req, res) => {
    try { await fn.call(ctrl, req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Filesystem ────────────────────────────────────────────────────
// List person_XXX folders not yet tracked in DB
router.get('/clusters/:batch',                        wrap(ctrl.listClusters));
// List ALL person_XXX folders (tracked or not) — for pre-ERP photo editing
router.get('/all-clusters/:batch',                    wrap(ctrl.listAllClusters));
// Delete an entire cluster folder (and its DB record if any)
router.delete('/cluster/:batch/:folder',              wrap(ctrl.deleteCluster));
// Delete a single photo from a cluster folder
router.delete('/cluster-photo/:batch/:folder/:filename', wrap(ctrl.deleteClusterPhoto));
// Serve a face-crop photo from any subfolder
router.get('/photo/:batch/:folder/:filename',         wrap(ctrl.servePhoto));
// Serve an ERP photo — batch-specific (new) or flat (legacy)
router.get('/erp-photo/:batch/:filename',             wrap(ctrl.serveErpPhoto));
router.get('/erp-photo/:filename',                    wrap(ctrl.serveErpPhoto));

// ── Matching ──────────────────────────────────────────────────────
// SSE stream: match clusters against ERP photos via Python ML service
router.post('/auto-match/:batch',                     wrap(ctrl.autoMatch));
// After SSE done: rename all person_XXX → rollNo + save to DB with approved=false
router.post('/auto-assign-all',                       wrap(ctrl.autoAssignAll));

// ── DB records ────────────────────────────────────────────────────
// Load all match records for a batch (for page reload)
router.get('/matches/:batch',                         wrap(ctrl.getMatches));

// ── Verification ──────────────────────────────────────────────────
// Operator approves a match (sets approved=true; renames folder if rollNo overridden)
router.post('/approve',                               wrap(ctrl.approve));
// Flag a cluster as incorrect
router.post('/flag',                                  wrap(ctrl.flagCluster));
// List open flags
router.get('/flagged/:batch',                         wrap(ctrl.listFlagged));
// Resolve a flag with corrected rollNo
router.post('/resolve-flag',                          wrap(ctrl.resolveFlag));

// ── Ground truth images for an approved student ───────────────────
router.get('/student-ground-truth/:batch/:rollNo',    wrap(ctrl.getStudentGroundTruth));

// ── Bulk operations ───────────────────────────────────────────────
router.post('/bulk-assign',                           wrap(ctrl.bulkAssign));

module.exports = router;

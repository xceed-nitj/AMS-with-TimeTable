// server/src/modules/attendanceModule/routes/flagRoutes.js

const express        = require('express');
const FlagController = require('../controllers/flagController');

const router     = express.Router();
const controller = new FlagController();

// ── Flag management ───────────────────────────────────────────────
router.post(  '/flag',                                       (req, res) => controller.flagCluster(req, res));
router.get(   '/flagged/:batch',                             (req, res) => controller.listFlagged(req, res));
router.post(  '/resolve-flag',                               (req, res) => controller.resolveFlag(req, res));

// ── Photo / folder management (used by edit mode in FlaggedAssign) ─
router.delete('/cluster/:batch/:folder',                     (req, res) => controller.deleteCluster(req, res));
router.delete('/cluster-photo/:batch/:folder/:filename',     (req, res) => controller.deleteClusterPhoto(req, res));
router.get(   '/all-clusters/:batch',                        (req, res) => controller.listAllClusters(req, res));

// ── Static file serving ───────────────────────────────────────────
router.get(   '/photo/:batch/:folder/:filename',             (req, res) => controller.servePhoto(req, res));
router.get(   '/erp-photo/:batch/:filename',                 (req, res) => controller.serveErpPhoto(req, res));

module.exports = router;

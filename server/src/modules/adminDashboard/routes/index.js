const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');

// ─── Overview ─────────────────────────────────────────────────
router.get('/overview', (req, res) => ctrl.getOverviewStats(req, res));
router.get('/today-schedule', (req, res) => ctrl.getTodaySchedule(req, res));
router.get('/system-health', (req, res) => ctrl.getSystemHealth(req, res));
router.get('/live-feed', (req, res) => ctrl.getLiveRecognitionFeed(req, res));

// ─── Students ─────────────────────────────────────────────────
router.get('/students', (req, res) => ctrl.getStudents(req, res));
router.post('/students', (req, res) => ctrl.createStudent(req, res));

// ─── Attendance ───────────────────────────────────────────────
router.get('/attendance', (req, res) => ctrl.getAttendanceRecords(req, res));
router.get('/attendance/stats', (req, res) => ctrl.getAttendanceStats(req, res));
router.get('/attendance/export', (req, res) => ctrl.exportAttendance(req, res));
router.put('/attendance/:id/override', (req, res) => ctrl.overrideAttendance(req, res));

// ─── Analytics ────────────────────────────────────────────────
router.get('/analytics/trends', (req, res) => ctrl.getAttendanceTrends(req, res));
router.get('/analytics/departments', (req, res) => ctrl.getDepartmentAnalysis(req, res));
router.get('/analytics/defaulters', (req, res) => ctrl.getRiskDefaulters(req, res));

// ─── Cameras ──────────────────────────────────────────────────
router.get('/cameras', (req, res) => ctrl.getCameras(req, res));
router.get('/cameras/stats', (req, res) => ctrl.getCameraStats(req, res));
router.get('/cameras/buildings', (req, res) => ctrl.getCameraBuildings(req, res));
router.get('/cameras/edge-nodes', (req, res) => ctrl.getEdgeNodes(req, res));
router.get('/cameras/network-health', (req, res) => ctrl.getNetworkHealth(req, res));
router.post('/cameras/:id/test', (req, res) => ctrl.testCamera(req, res));
router.post('/cameras/:id/restart', (req, res) => ctrl.restartCamera(req, res));

// ─── Live Monitor ─────────────────────────────────────────────
router.get('/live-monitor/detections', (req, res) => ctrl.getLiveDetections(req, res));
router.get('/live-monitor/engine-status', (req, res) => ctrl.getEngineStatus(req, res));
router.get('/live-monitor/feeds', (req, res) => ctrl.getCameraFeeds(req, res));

// ─── Alerts ───────────────────────────────────────────────────
router.get('/alerts', (req, res) => ctrl.getAlerts(req, res));
router.get('/alerts/summary', (req, res) => ctrl.getAlertSummary(req, res));
router.get('/alerts/rules', (req, res) => ctrl.getAlertRules(req, res));
router.put('/alerts/:id/resolve', (req, res) => ctrl.resolveAlert(req, res));
router.put('/alerts/:id/dismiss', (req, res) => ctrl.dismissAlert(req, res));
router.put('/alerts/rules/:id', (req, res) => ctrl.updateAlertRule(req, res));

// ─── Settings ─────────────────────────────────────────────────
router.get('/settings/engine', (req, res) => ctrl.getEngineConfig(req, res));
router.put('/settings/engine', (req, res) => ctrl.updateEngineConfig(req, res));
router.get('/settings/model-info', (req, res) => ctrl.getModelInfo(req, res));
router.post('/settings/backup', (req, res) => ctrl.backupDatabase(req, res));
router.post('/settings/rebuild-embeddings', (req, res) => ctrl.rebuildEmbeddings(req, res));
router.get('/settings/export-archive', (req, res) => ctrl.exportArchive(req, res));
router.post('/settings/reset-today', (req, res) => ctrl.resetTodayRecords(req, res));

module.exports = router;

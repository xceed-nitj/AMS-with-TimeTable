// server/src/modules/attendanceModule/routes/attendanceReportRoutes.js

const express = require('express');
const router  = express.Router();
const AttendanceReportController = require('../controllers/attendanceReportController');

const ctrl = new AttendanceReportController();

// Save report after ML processes a video
router.post('/save', async (req, res) => {
    try { await ctrl.saveReport(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// List reports (filters via query: batch, date, faculty, subject, status)
router.get('/', async (req, res) => {
    try { await ctrl.getReports(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Get reports for a batch on a specific date
router.get('/by-date/:batch/:date', async (req, res) => {
    try { await ctrl.getReportByDate(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Get student attendance history across all sessions
router.get('/student/:batch/:rollNo', async (req, res) => {
    try { await ctrl.getStudentHistory(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Get locksem context (subject / faculty / slot info)
router.get('/locksem-context/:locksemId', async (req, res) => {
    try { await ctrl.getLocksemContext(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Finalize a report
router.post('/:id/finalize', async (req, res) => {
    try { await ctrl.finalizeReport(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Manually override one student's final status
router.patch('/:id/student/:rollNo', async (req, res) => {
    try { await ctrl.updateStudentStatus(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete a draft report
router.delete('/:id', async (req, res) => {
    try { await ctrl.deleteReport(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Get full report by ID (keep last to avoid conflicts with named routes above)
router.get('/:id', async (req, res) => {
    try { await ctrl.getReportById(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

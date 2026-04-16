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

// ─── Session management (multi-run attendance) ──────────────────────────────
const sessionCtrl = require('../controllers/attendanceSessionController');

// Start a multi-run session
router.post('/start-session', async (req, res) => {
    try {
        const result = await sessionCtrl.startSession(req.body);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Stop a running session
router.post('/stop-session/:reportId', async (req, res) => {
    try {
        const result = await sessionCtrl.stopSession(req.params.reportId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get session status
router.get('/session-status/:reportId', async (req, res) => {
    try {
        res.json(sessionCtrl.getSessionStatus(req.params.reportId));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// List all active sessions
router.get('/active-sessions', async (req, res) => {
    try {
        res.json(sessionCtrl.listActiveSessions());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get full report by ID (keep last to avoid conflicts with named routes above)
router.get('/:id', async (req, res) => {
    try { await ctrl.getReportById(req, res); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
// GET /attendancemodule/reports/lookup-context?room=lt101&slot=period1&date=2026-04-08
router.get('/lookup-context', async (req, res) => {
    try {
        const { room, slot, date } = req.query;
        if (!room || !slot) return res.status(400).json({ error: 'room and slot required' });

        const LockSem   = require('../../../models/locksem');
        const TimeTable = require('../../../models/timetable');

        // Get day-of-week from date (defaults to today)
        const d = date ? new Date(date) : new Date();
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const day  = days[d.getDay()];

        // Find all locksem entries for this slot+day that have this room in slotData
        const entries = await LockSem.find({
            slot,
            day,
            'slotData.room': { $regex: new RegExp(`^${room.trim()}$`, 'i') }
        }).populate('timetable', 'name dept session degree sem');

        if (!entries.length) {
            return res.json({ found: false });
        }

        // Pick the first match and build context
        const entry    = entries[0];
        const slotItem = entry.slotData.find(s =>
            s.room?.toLowerCase().trim() === room.toLowerCase().trim()
        );
        const tt       = entry.timetable;

        // Sanitize dept name the same way the frontend does
        const sanitizedDept = (tt?.dept || '').trim().replace(/\s+/g, '_').toUpperCase();
        const degree        = tt?.degree || 'BTECH';
        const sem           = entry.sem || tt?.sem || '';

        // Derive year from sem (sem 1-2 → year 1, 3-4 → year 2, etc.)
        const semNum = parseInt(sem) || 0;
        const year   = semNum > 0 ? String(new Date().getFullYear() - Math.ceil(semNum / 2) + 1) : '';

        const batch = `${degree}_${sanitizedDept}_${year}`.toUpperCase();

        res.json({
            found:     true,
            batch,
            subject:   slotItem?.subject  || '',
            faculty:   slotItem?.faculty  || '',
            semester:  sem,
            department: sanitizedDept,
            degree,
            day,
            locksemId: entry._id,
        });
    } catch (err) {
        console.error('[lookup-context]', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

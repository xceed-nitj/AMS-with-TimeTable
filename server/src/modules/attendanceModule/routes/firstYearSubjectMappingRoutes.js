// server/src/modules/attendanceModule/routes/firstYearSubjectMappingRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/firstYearSubjectMappingController");
const { attendanceRoleAccess } = require("../middleware/attendanceAccess");

// Admin-only: mapping affects every department's first-year allotment view,
// so it isn't scoped to the caller's own department the way most attendance
// routes are (no enforceAttendanceDepartment here).
router.get("/subjects/:code", ...attendanceRoleAccess,(req, res) => {
    controller.listSubjects(req, res);
});

router.put("/subjects/:id", ...attendanceRoleAccess, (req, res) => {
    controller.mapSubjectToDept(req, res);
});

router.get("/session-subjects/:session", ...attendanceRoleAccess, (req, res) => {
    controller.listSubjectsBySession(req, res);
});

module.exports = router;

const express = require("express");
const router  = express.Router();

router.use('/student',      require("./student"));
router.use('/ground-truth', require("./groundTruthRoutes"));
router.use('/roll-assign',  require("./rollAssignRoutes"));
router.use('/reports',      require("./attendanceReportRoutes"));

module.exports = router;

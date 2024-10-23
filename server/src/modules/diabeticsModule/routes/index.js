const express = require("express");

const router = express.Router();

router.use("/dailyDosage", require("./dailyDosage.js"));
router.use("/gamification", require("./gamification.js"));
router.use("/hospital", require("./hospital.js"));
router.use("/patient", require("./patient.js"));
router.use("/sickday", require("./sickday.js"));
router.use("/doctor", require("./doctor.js"));

module.exports = router;
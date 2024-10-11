const express = require("express");
const { addSickDay, getSickDays, getSickDayById, updateSickDay, deleteSickDay } = require("../controllers/sickday");

const router = express.Router();

router.post("/add", addSickDay);
router.get("/all/:patientId", getSickDays);
router.get("/:id", getSickDayById);
router.patch("/:id", updateSickDay);
router.delete("/:id", deleteSickDay);

module.exports = router;
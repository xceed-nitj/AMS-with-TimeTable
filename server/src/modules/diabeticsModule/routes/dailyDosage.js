const express = require("express");
const { addDosage, getAllDosages, getDosageById, updateDosage, deleteDosage } = require("../controllers/dailyDosage");

const router = express.Router();

router.post("/add", addDosage);
router.get("/all/:patientId", getAllDosages);
router.get("/:id", getDosageById);
router.patch("/:id", updateDosage);
router.delete("/:id", deleteDosage);

module.exports = router;
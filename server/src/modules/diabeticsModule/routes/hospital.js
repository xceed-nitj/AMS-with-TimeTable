const express = require("express");
const { addHospital, getHospitals, getHospitalById, updateHospital, deleteHospital } = require("../controllers/hospital");

const router = express.Router();

router.post("/add", addHospital);
router.get("/all", getHospitals);
router.get("/:id", getHospitalById);
router.patch("/:id", updateHospital);
router.delete("/:id", deleteHospital);

module.exports = router;
const express = require('express');
const { addDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor } = require('../controllers/doctor'); // Import the controller
const router = express.Router();

// Route to add a new patient
router.post('/add', addDoctor); // POST /api/v1/diabeticsmodule/patient
router.get("/all", getAllDoctors);
router.get("/:id", getDoctorById);
router.patch("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

module.exports = router;
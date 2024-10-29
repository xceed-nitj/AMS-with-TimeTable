const express = require('express');
const { addPatient, getAllPatients, getPatientById, updatePatient, deletePatient, loginPatient } = require('../controllers/patient'); // Import the controller
const router = express.Router();

// Route to add a new patient
router.post('/add', addPatient); // POST /api/v1/diabeticsmodule/patient
router.get("/all", getAllPatients);
router.get("/:id", getPatientById);
router.patch("/:id", updatePatient);
router.delete("/:id", deletePatient);
router.post('/login', loginPatient);

module.exports = router;

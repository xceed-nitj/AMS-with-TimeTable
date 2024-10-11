const express = require('express');
const { addPatient } = require('../controllers/patient'); // Import the controller
const router = express.Router();

// Route to add a new patient
router.post('/', addPatient); // POST /api/v1/diabeticsmodule/patient

module.exports = router;

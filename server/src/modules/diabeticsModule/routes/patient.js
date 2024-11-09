const express = require('express');
const { addPatient, getAllPatients, getPatientById, updatePatient, deletePatient, loginPatient } = require('../controllers/patient'); // Import the controller
const router = express.Router();
const { checkRole } = require("../../checkRole.middleware");

const checkPatientAccess = async (req, res, next) => {
    if (req.user.roles.includes('patient')) {
        const patientId = req.params.id;
        if (req.user.id !== patientId) {
            return res.status(403).json({ message: 'Forbidden: Access to this resource is denied' });
        }
    }
    next();
};
// Route to add a new patient
router.post('/add', addPatient); // POST /api/v1/diabeticsmodule/patient
router.get("/all", checkRole(['admin']), getAllPatients);
router.get("/:id", checkRole(['admin', 'patient']), checkPatientAccess, getPatientById);
router.patch("/:id", checkRole(['admin', 'patient']), checkPatientAccess, updatePatient);
router.delete("/:id", checkRole(['admin']), deletePatient);
router.post('/login', loginPatient);

module.exports = router;

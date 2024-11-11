const express = require('express');
const { addDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    registerPatient,
    loginDoctor } = require('../controllers/doctor'); // Import the controller
const router = express.Router();
const { checkRole } = require("../../checkRole.middleware");

const checkDoctorAccess = (req, res, next) => {
    if (req.user.roles.includes('doctor')) {
        const doctorIdFromToken = req.user.id; // Assuming `id` from decoded JWT is the doctor's ID
        const doctorIdFromParams = req.params.id;

        if (doctorIdFromToken !== doctorIdFromParams) {
            return res.status(403).json({ message: "Forbidden: Access to this resource is denied" });
        }
    }
    next();
};

// Route to add a new patient
router.post('/add', addDoctor); // POST /api/v1/diabeticsmodule/patient
router.get("/all", checkRole(['admin']), getAllDoctors);
router.get("/:id", checkRole(['admin']), getDoctorById);
router.patch("/:id", checkRole(['admin', 'doctor']), checkDoctorAccess, updateDoctor);
router.delete("/:id", checkRole(['admin']), deleteDoctor);
router.put('/registerPatient', checkRole(['doctor']), registerPatient); // PUT /api/v1/diabeticsmodule/doctor/registerPatient
router.post('/login', loginDoctor);

module.exports = router;
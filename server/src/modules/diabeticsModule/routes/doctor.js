const express = require('express')
const {
  addDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  registerPatient,
  loginDoctor,
  getDoctorCount,
  getDoctorPatients,
  getDoctorOwnData,
  assignPatientsToDoctor,
  removePatientFromDoctor,
} = require('../controllers/doctor') // Import the controller
const router = express.Router()
const { checkRole } = require('../../checkRole.middleware')

const checkDoctorAccess = (req, res, next) => {
  if (req.user.roles.includes('doctor')) {
    const doctorIdFromToken = req.user.id // Assuming `id` from decoded JWT is the doctor's ID
    const doctorIdFromParams = req.params.id

    if (doctorIdFromToken !== doctorIdFromParams) {
      return res
        .status(403)
        .json({ message: 'Forbidden: Access to this resource is denied' })
    }
  }
  next()
}

// Define the count route first (before any routes with :id parameter)
router.get('/count', checkRole(['admin', 'dm-admin']), getDoctorCount)

// Route for doctors to fetch their own data
router.get('/me', checkRole(['doctor']), getDoctorOwnData)

// Route to add a new patient
router.post('/add', addDoctor) // POST /api/v1/diabeticsmodule/patient
router.get('/all', checkRole(['admin', 'dm-admin']), getAllDoctors)
router.get('/:id', checkRole(['admin', 'dm-admin']), getDoctorById)
router.patch('/:id', checkRole(['admin', 'dm-admin', 'doctor']), updateDoctor)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deleteDoctor)
router.put('/registerPatient', checkRole(['doctor']), registerPatient) // PUT /api/v1/diabeticsmodule/doctor/registerPatient
router.post('/login', loginDoctor)

// Route to get all patients for a doctor
router.get(
  '/:id/patients',
  checkRole(['admin', 'dm-admin', 'doctor']),
  getDoctorPatients
)

// Route to assign multiple patients to a doctor
router.post(
  '/:doctorId/assignPatients',
  checkRole(['admin', 'dm-admin']),
  assignPatientsToDoctor
)

// Route to remove a patient from a doctor
router.delete(
  '/:doctorId/patient/:patientId',
  checkRole(['admin', 'dm-admin']),
  removePatientFromDoctor
)

module.exports = router

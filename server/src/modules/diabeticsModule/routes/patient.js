const express = require('express')
const {
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  loginPatient,
  getPatientCount,
  getPatientOwnData,
  getUnassignedPatients,
} = require('../controllers/patient') // Import the controller
const router = express.Router()
const { checkRole } = require('../../checkRole.middleware')

// const checkPatientAccess = async (req, res, next) => {
//   if (req.user.roles.includes('patient')) {
//     const patientId = req.params.id
//     if (req.user.id !== patientId) {
//       return res
//         .status(403)
//         .json({ message: 'Forbidden: Access to this resource is denied' })
//     }
//   }
//   next()
// }

// Define the count route first (before any routes with :id parameter)
router.get('/count', checkRole(['admin', 'dm-admin']), getPatientCount)

// Route for patients to fetch their own data
router.get('/me', checkRole(['patient']), getPatientOwnData)

// Route to add a new patient
router.post('/add', addPatient) // POST /api/v1/diabeticsmodule/patient
router.get('/all', checkRole(['admin', 'dm-admin']), getAllPatients)
router.get('/:id', checkRole(['admin', 'dm-admin', 'patient']), getPatientById)
router.patch('/:id', checkRole(['admin', 'dm-admin', 'patient']), updatePatient)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deletePatient)
router.post('/login', loginPatient)

// Route to get unassigned patients for a doctor
router.get(
  '/unassigned/:doctorId',
  checkRole(['admin', 'dm-admin']),
  getUnassignedPatients
)

module.exports = router

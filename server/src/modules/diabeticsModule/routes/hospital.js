const express = require('express')
const {
  addHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  addPatientToHospital,
  addDoctorToHospital,
  getHospitalCount,
  getHospitalDoctors,
  getHospitalPatients,
  getUnassignedDoctors,
  assignDoctorsToHospital,
  removeDoctorFromHospital,
} = require('../controllers/hospital')
const { checkRole } = require('../../checkRole.middleware')

const router = express.Router()

// Define the count route first (before any routes with :id parameter)
router.get('/count', checkRole(['admin', 'dm-admin']), getHospitalCount)

// Basic hospital CRUD routes
router.post('/add', checkRole(['admin', 'dm-admin']), addHospital)
router.get('/all', checkRole(['admin', 'dm-admin', 'doctor']), getHospitals)
router.get('/:id', checkRole(['admin', 'dm-admin', 'doctor']), getHospitalById)
router.patch('/:id', checkRole(['admin', 'dm-admin']), updateHospital)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deleteHospital)

// Hospital doctor management routes
router.get(
  '/:id/doctors',
  checkRole(['admin', 'dm-admin', 'doctor']),
  getHospitalDoctors
)
router.get(
  '/:id/patients',
  checkRole(['admin', 'dm-admin', 'doctor']),
  getHospitalPatients
)
router.get(
  '/doctor/unassigned/:hospitalId',
  checkRole(['admin', 'dm-admin']),
  getUnassignedDoctors
)
router.post(
  '/:id/assignDoctors',
  checkRole(['admin', 'dm-admin']),
  assignDoctorsToHospital
)
router.delete(
  '/:id/doctor/:doctorId',
  checkRole(['admin', 'dm-admin']),
  removeDoctorFromHospital
)

module.exports = router

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
} = require('../controllers/hospital')
const { checkRole } = require('../../checkRole.middleware')

const router = express.Router()

// Define the count route first (before any routes with :id parameter)
router.get('/count', checkRole(['admin', 'dm-admin']), getHospitalCount)

router.post('/add', checkRole(['admin', 'dm-admin']), addHospital)
router.get('/all', checkRole(['admin', 'dm-admin', 'doctor']), getHospitals)
router.get('/:id', checkRole(['admin', 'dm-admin', 'doctor']), getHospitalById)
router.patch('/:id', checkRole(['admin', 'dm-admin']), updateHospital)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deleteHospital)

module.exports = router

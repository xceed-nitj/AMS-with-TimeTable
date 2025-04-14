const express = require('express')
const {
  addDosage,
  getAllDosages,
  getDosageById,
  updateDosage,
  deleteDosage,
  getDailyDosageCount,
  getLatestReading,
  getReadingsByDate,
  getReadingsByDateRange,
  getPatientOwnReadingsByDate,
  getPatientOwnReadingsByDateRange,
  getDoctorPatientReadingsByDate,
  getDoctorPatientReadingsByDateRange,
} = require('../controllers/dailyDosage')
const { checkRole } = require('../../checkRole.middleware')

const router = express.Router()

// Define the count route first (before any routes with :id parameter)
router.get('/count', checkRole(['admin', 'dm-admin']), getDailyDosageCount)

// Routes for patients to access their own data
router.get(
  '/me/date/:date',
  checkRole(['patient']),
  getPatientOwnReadingsByDate
)

router.get(
  '/me/range/:startDate/:endDate',
  checkRole(['patient']),
  getPatientOwnReadingsByDateRange
)

// Routes for doctors to access their patients' data
router.get(
  '/doctor/patient/:patientId/date/:date',
  checkRole(['doctor']),
  getDoctorPatientReadingsByDate
)

router.get(
  '/doctor/patient/:patientId/range/:startDate/:endDate',
  checkRole(['doctor']),
  getDoctorPatientReadingsByDateRange
)

router.post(
  '/add',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  addDosage
)
router.get(
  '/all/:patientId',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getAllDosages
)
router.get(
  '/:id',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getDosageById
)
router.patch('/:id', checkRole(['admin', 'dm-admin', 'doctor']), updateDosage)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deleteDosage)

// Route to get latest reading for a patient
router.get(
  '/patient/:patientId/latest',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getLatestReading
)

// Route to get readings for a patient by date
router.get(
  '/patient/:patientId/date/:date',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getReadingsByDate
)

// Route to get readings for a patient within a date range
router.get(
  '/patient/:patientId/range/:startDate/:endDate',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getReadingsByDateRange
)

module.exports = router

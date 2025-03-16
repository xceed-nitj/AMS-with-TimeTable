const express = require('express')
const {
  addSickDay,
  getSickDays,
  getSickDayById,
  updateSickDay,
  deleteSickDay,
} = require('../controllers/sickday')
const { checkRole } = require('../../checkRole.middleware')

const router = express.Router()

router.post('/add', checkRole(['admin', 'dm-admin', 'doctor']), addSickDay)
router.get(
  '/all/:patientId',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getSickDays
)
router.get(
  '/:id',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getSickDayById
)
router.patch('/:id', checkRole(['admin', 'dm-admin', 'doctor']), updateSickDay)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deleteSickDay)

module.exports = router

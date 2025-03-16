const express = require('express')
const {
  addGamification,
  getAllGamifications,
  getGamificationById,
  updateGamification,
  deleteGamification,
} = require('../controllers/gamification')
const { checkRole } = require('../../checkRole.middleware')

const router = express.Router()

router.post('/add', checkRole(['admin', 'dm-admin']), addGamification)
router.get(
  '/all',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getAllGamifications
)
router.get(
  '/:id',
  checkRole(['admin', 'dm-admin', 'doctor', 'patient']),
  getGamificationById
)
router.patch('/:id', checkRole(['admin', 'dm-admin']), updateGamification)
router.delete('/:id', checkRole(['admin', 'dm-admin']), deleteGamification)

module.exports = router

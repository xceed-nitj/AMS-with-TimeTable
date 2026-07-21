const express = require("express");
const router = express.Router();
const {
  createFormAnswer,
  getFormAnswers,
  getFormAnswerById,
  updateFormAnswerById,
  deleteFormAnswerById,
  getFormAnswerByEventUserFormId
} = require('../controller/formAnswers');
const { checkRole } = require('../../checkRole.middleware');

// Create a new form answer
router.post('/', checkRole(['admin']), createFormAnswer);

// Get all form answers
router.get('/', getFormAnswers);
router.get('/get/:eventId/:formId/:userId',getFormAnswerByEventUserFormId);
// Get a specific form answer by ID
router.get('/:id', getFormAnswerById);

// Update a form answer by ID
router.patch('/:id', checkRole(['admin']), updateFormAnswerById);

// Delete a form answer by ID
router.delete('/:id', checkRole(['admin']), deleteFormAnswerById);

module.exports = router;



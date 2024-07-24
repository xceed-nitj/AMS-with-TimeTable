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

// Create a new form answer
router.post('/', createFormAnswer);

// Get all form answers
router.get('/', getFormAnswers);
router.get('/get/:eventId/:formId/:userId',getFormAnswerByEventUserFormId);
// Get a specific form answer by ID
router.get('/:id', getFormAnswerById);

// Update a form answer by ID
router.patch('/:id', updateFormAnswerById);

// Delete a form answer by ID
router.delete('/:id', deleteFormAnswerById);

module.exports = router;



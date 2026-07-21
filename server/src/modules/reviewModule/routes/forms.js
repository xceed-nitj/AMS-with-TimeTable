const express = require("express");
const router = express.Router();
const {getFormByEventIdAndFormId,getFormsByEventId,createForm,getAllForms,getFormById,updateForm,deleteForm} = require('../controller/forms');
const { checkRole } = require('../../checkRole.middleware');

// Create a new form
router.post("/", checkRole(['admin']), createForm);

// Get all forms
router.get("/", getAllForms);
router.get('/event/:eventId', getFormsByEventId);
router.get('/:eventId/:formId',getFormByEventIdAndFormId);
// Get a form by ID
router.get("/:id", getFormById);

// Update a form
router.put("/:id", checkRole(['admin']), updateForm);

// Delete a form
router.delete("/:id", checkRole(['admin']), deleteForm);

module.exports = router;

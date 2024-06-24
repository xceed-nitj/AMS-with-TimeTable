const express = require('express');
const router = express.Router();
const superAdminRoute=require("../../usermanagement/superadminroute")
const {
    addDefaultQuestion,
    getDefaultQuestions,
    getDefaultQuestionById,
    updateDefaultQuestion,
    deleteDefaultQuestion
} = require('../controller/defaultQuestion');


// Routes for DefaultQuestions
router.post('/add', addDefaultQuestion);
router.get('/all',  getDefaultQuestions);
router.get('/:id', getDefaultQuestionById);
router.put('/:id', updateDefaultQuestion);
router.delete('/:id', deleteDefaultQuestion);

module.exports = router;

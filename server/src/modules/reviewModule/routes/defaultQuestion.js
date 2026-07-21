const express = require('express');
const router = express.Router();
const superAdminRoute=require("../../usermanagement/superadminroute")
const { checkRole } = require('../../checkRole.middleware');
const {
    addDefaultQuestion,
    getDefaultQuestions,
    getDefaultQuestionById,
    updateDefaultQuestion,
    deleteDefaultQuestion
} = require('../controller/defaultQuestion');


// Routes for DefaultQuestions
router.post('/add', checkRole(['admin']), addDefaultQuestion);
router.get('/all',  getDefaultQuestions);
router.get('/:id', getDefaultQuestionById);
router.patch('/:id', checkRole(['admin']), updateDefaultQuestion);
router.delete('/:id', checkRole(['admin']), deleteDefaultQuestion);

module.exports = router;

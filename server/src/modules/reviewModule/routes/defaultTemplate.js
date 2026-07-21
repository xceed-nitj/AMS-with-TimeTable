const express = require('express');
const router = express.Router();
const {
    getDefaultTemplate,
    updateDefaultTemplate,
    postDefaultTemplate
} = require('../controller/defaultTemplate');
const { checkRole } = require('../../checkRole.middleware');

// Routes for Default Templates
router.get('/template', getDefaultTemplate);
router.patch('/template', checkRole(['admin']), updateDefaultTemplate);
router.post('/templates', checkRole(['admin']), postDefaultTemplate);

module.exports = router;

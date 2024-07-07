const express = require('express');
const router = express.Router();
const {
    getDefaultTemplate,
    updateDefaultTemplate,
    postDefaultTemplate
} = require('../controller/defaultTemplate');

// Routes for Default Templates
router.get('/template', getDefaultTemplate);
router.patch('/template', updateDefaultTemplate);
router.post('/templates',postDefaultTemplate);

module.exports = router;

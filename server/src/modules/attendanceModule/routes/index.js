const express = require("express");
const router = express.Router();

router.use('/student', require("./student"));

module.exports = router;
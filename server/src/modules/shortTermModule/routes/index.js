const express = require("express");
const router = express.Router();

router.use('/shortterm', require("./shortterm")); 
module.exports = router;


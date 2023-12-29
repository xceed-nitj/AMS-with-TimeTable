const express = require("express");
const router = express.Router();

router.use('/addevent', require("./addevent")); 
router.use('/certificate', require("./certificate")); 
router.use('/participant', require("./participant"));

  
module.exports = router;


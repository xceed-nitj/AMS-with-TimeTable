const express = require("express");
const router = express.Router();

router.use('/getuser', require("./user")); 
module.exports = router;


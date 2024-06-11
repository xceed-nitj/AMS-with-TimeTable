const express = require("express");
const router = express.Router();
const studentRoute = require("../../../usermanagement/studentRoute");

router.use('/:code', studentRoute, require("./quiz"));
router.use('/quiz/:code/studentanswer/:currentIndex', studentRoute, require("./quiz"));
router.use('/quiz/:code/studentresult', studentRoute, require("./quiz"));
router.use('/:code/studentquiz', studentRoute, require('./quiz'));

module.exports = router;
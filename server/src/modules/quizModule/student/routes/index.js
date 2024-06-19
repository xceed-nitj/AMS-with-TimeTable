const express = require("express");
const router = express.Router();
const studentRoute = require("../../../usermanagement/studentRoute");

router.use('/quizzes', studentRoute, require('./quiz'));
router.use('/:code', studentRoute, require("./quiz"));
router.use('/:code/:currentIndex', studentRoute, require("./quiz"));
router.use('/:code/result', studentRoute, require("./quiz"));

module.exports = router;
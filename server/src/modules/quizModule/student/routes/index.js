const express = require("express");
const studentRoute = require("../../../usermanagement/studentRoute");
const router = express.Router();

router.use('/:code', studentRoute, require("./quiz"));

module.exports = router;
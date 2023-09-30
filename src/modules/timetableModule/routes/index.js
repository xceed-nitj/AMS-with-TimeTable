const express = require("express");
const router = express.Router();
// const FacultyController = require("../controllers/facultyprofile");

router.use('/faculty', require("./faculty")); 


module.exports = router;

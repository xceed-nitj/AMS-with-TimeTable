const express = require("express");
const router = express.Router();
// const FacultyController = require("../controllers/facultyprofile");

router.use('/timetable', require("./timetable")); 
router.use('/faculty', require("./faculty")); 
router.use('/subject', require("./subject")); 


module.exports = router;

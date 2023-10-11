const express = require("express");
const router = express.Router();
// const FacultyController = require("../controllers/facultyprofile");

router.use('/timetable', require("./timetable")); 
router.use('/teacher', require("./faculty")); 
router.use('/subject', require("./subject")); 


module.exports = router;

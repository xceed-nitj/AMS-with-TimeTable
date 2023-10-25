const express = require("express");
const router = express.Router();
// const FacultyController = require("../controllers/facultyprofile");

router.use('/timetable', require("./timetable")); 
router.use('/faculty', require("./faculty")); 
router.use('/subject', require("./subject")); 
router.use('/tt', require("./classtimetable")); 
router.use('/addfaculty', require("./addfaculty")); 
router.use('/lock', require("./locktimetable")); 
router.use('/masterroom', require("./masterroom")); 
module.exports = router;

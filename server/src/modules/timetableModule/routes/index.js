const express = require("express");
const router = express.Router();
const protectRoute =require("../../usermanagement/privateroute")

router.use('/timetable', protectRoute, require("./timetable")); 
router.use('/faculty', require("./faculty")); 
router.use('/subject', require("./subject")); 
router.use('/tt', require("./classtimetable")); 
router.use('/addfaculty', require("./addfaculty")); 
router.use('/lock', require("./locktimetable")); 
router.use('/masterroom', require("./masterroom")); 
router.use('/addroom', require("./addroom")); 
router.use('/addsem', require("./addsem")); 
module.exports = router;

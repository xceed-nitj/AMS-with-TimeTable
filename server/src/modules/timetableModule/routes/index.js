const express = require("express");
const router = express.Router();
const protectRoute =require("../../usermanagement/privateroute")

router.use('/timetable', require("./timetable")); 
router.use('/faculty', require("./faculty")); 
router.use('/subject', require("./subject")); 
router.use('/tt',protectRoute, require("./classtimetable")); 
router.use('/addfaculty',require("./addfaculty")); 
router.use('/lock', require("./locktimetable")); 
router.use('/masterroom', require("./masterroom")); 
router.use('/mastersem',protectRoute, require("./mastersem")); 
router.use('/addroom', require("./addroom")); 
router.use('/addsem', require("./addsem")); 
router.use('/allotment',protectRoute, require("./allotment")); 
router.use('/import',protectRoute, require("./importdata")); 
router.use('/lockfaculty', protectRoute,require("./lockfaculty")); 
router.use('/note', require("./note")); 
router.use('/commonLoad', require("./commonLoad")); 
router.use('/instituteLoad', require("./instituteLoad")); 
router.use('/mastertable', require("./masterclasstable")); 

module.exports = router;


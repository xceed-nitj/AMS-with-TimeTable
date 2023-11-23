const express = require("express");
const router = express.Router();
const protectRoute =require("../../usermanagement/privateroute")

router.use('/timetable', protectRoute, require("./timetable")); 
router.use('/faculty', protectRoute,require("./faculty")); 
router.use('/subject', require("./subject")); 
router.use('/tt',protectRoute, require("./classtimetable")); 
router.use('/addfaculty',protectRoute,require("./addfaculty")); 
router.use('/lock',protectRoute, require("./locktimetable")); 
router.use('/masterroom', require("./masterroom")); 
router.use('/mastersem',protectRoute, require("./mastersem")); 
router.use('/addroom',protectRoute, require("./addroom")); 
router.use('/addsem',protectRoute, require("./addsem")); 
router.use('/allotment',protectRoute, require("./allotment")); 
router.use('/lockfaculty', protectRoute,require("./lockfaculty")); 
router.use('/note',protectRoute, require("./note")); 
router.use('/commonLoad',protectRoute, require("./commonLoad")); 
module.exports = router;


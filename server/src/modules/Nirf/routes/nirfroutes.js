const express = require('express');
// const {getEvents, getEventById, addEvent, updateEvent, deleteEvent, addEditor, addReviewer,getAllReviewersInEvent ,getEventsByUser ,getEventIdByName} = require('../controller/event');
// const protectRoute =require("../../usermanagement/privateroute")
// const superAdminRoute=require("../../usermanagement/superadminroute")
const {getAllRanking, addRanking}=require('../controller/nirfcontroller');


const router = express.Router();

router.get('/getranking', getAllRanking);
router.post('/addranking/:year/:category',addRanking);

module.exports = router;
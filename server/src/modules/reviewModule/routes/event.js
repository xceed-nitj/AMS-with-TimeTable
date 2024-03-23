const express = require('express');
const {getEvents, getEventById, addEvent, updateEvent, deleteEvent, addEditor, getEventsByUser } = require('../controller/event');
const protectRoute =require("../../usermanagement/privateroute")
const superAdminRoute=require("../../usermanagement/superadminroute")

const router = express.Router();

router.get('/getAllEvents', getEvents);
router.get('/geteventsbyuser',protectRoute, getEventsByUser);
router.get('/:id', getEventById);
router.post('/addevent', superAdminRoute, addEvent);
router.post('/addEditor/:id', addEditor);
router.patch('/:id',protectRoute,updateEvent);
router.delete('/:id',superAdminRoute, deleteEvent);

module.exports = router;
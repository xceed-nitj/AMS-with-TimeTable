const express = require('express');
const {getEvents, getEventById, addEvent, updateEvent, deleteEvent, addEditor, getEventsByUser ,getEventIdByName} = require('../controller/event');
const protectRoute =require("../../usermanagement/privateroute")
const superAdminRoute=require("../../usermanagement/superadminroute")



const router = express.Router();

router.get('/getAllEvents', getEvents);
router.get('/geteventsbyuser',protectRoute, getEventsByUser);
router.get('/:id', getEventById);
router.get('/name/:name',getEventIdByName);
// router.get('/getEditorId/:email',getEditorIdByEmail);
router.post('/addevent', superAdminRoute, addEvent);
router.post('/addEditor/:id', addEditor);
router.patch('/:id',protectRoute,updateEvent);
router.delete('/:id',superAdminRoute, deleteEvent);

module.exports = router;
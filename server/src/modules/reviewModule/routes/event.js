const express = require('express');
const {getEvents, getEventById, addEvent, updateEvent, updateEventTemplate,deleteEvent, addEditor, addReviewer,getAllReviewersInEvent ,getEventsByUser ,getEventIdByName,updateReviewerStatus,resendInvitation} = require('../controller/event');
const protectRoute =require("../../usermanagement/privateroute")
const superAdminRoute=require("../../usermanagement/superadminroute")



const router = express.Router();

router.get('/getAllEvents', getEvents);
router.get('/getReviewerInEvent/:id',getAllReviewersInEvent);
router.get('/getEvents/:id',getEventById);

router.get('/geteventsbyuser',protectRoute, getEventsByUser);
router.get('/:id', getEventById);
router.get('/name/:name',getEventIdByName);
// router.get('/getEditorId/:email',getEditorIdByEmail);
router.post('/addevent', superAdminRoute, addEvent);
router.post('/addEditor/:id', addEditor);
router.post('/addReviewer/:id', addReviewer);
router.post('/resendInvitation/:id',resendInvitation);

router.patch('/:id',updateEventTemplate);
router.delete('/:id',superAdminRoute, deleteEvent);
router.post('/updateReviewerStatus/:eventId/:reviewerId', updateReviewerStatus);

module.exports = router;

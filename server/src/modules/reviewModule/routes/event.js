const express = require('express');
const {get_fields,getEvents,addDefaultTemplatesToEvent ,getEventById,updateStartSubmission ,addEvent, updateEvent, updateEventTemplate,deleteEvent, addEditor, addReviewer,getAllReviewersInEvent ,getEventsByUser ,getEventIdByName,updateReviewerStatus,resendInvitation, findEventByReviewer, getformsByEventId} = require('../controller/event');
const protectRoute =require("../../usermanagement/privateroute")
const superAdminRoute=require("../../usermanagement/superadminroute")



const router = express.Router();

router.get('/getAllEvents', getEvents);
router.get('/getReviewerInEvent/:id',getAllReviewersInEvent);
router.get('/getEvents/:id',getEventById);
router.get('/getFields/:collectionName',get_fields);
router.get('/geteventsbyuser',protectRoute, getEventsByUser);
router.get('/:id', getEventById);
router.get('/name/:name',getEventIdByName);
router.get('/geteventsbyreviewer/:id', findEventByReviewer);
router.get('/forms/:id', getformsByEventId);
// router.get('/getEditorId/:email',getEditorIdByEmail);
router.post('/addevent', superAdminRoute, addEvent);
router.post('/addEditor/:id', addEditor);
router.post('/addReviewer/:id', addReviewer);
router.post('/resendInvitation/:id',resendInvitation);

router.patch('/:id',updateEvent);
router.patch('/template/:id',updateEventTemplate);
router.put('/addDefaultTemplate/:id',addDefaultTemplatesToEvent);
router.delete('/:id',superAdminRoute, deleteEvent);
router.post('/updateReviewerStatus/:eventId/:reviewerId', updateReviewerStatus);
router.patch('/updateStartSubmission/:id', updateStartSubmission);

module.exports = router;

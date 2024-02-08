const express = require('express');
const {getEvents, getEvent, addEvent, updateEvent, deleteEvent, addEditor } = require('../controller/event');

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', addEvent);
router.post('/addEditor/:id', addEditor);
router.patch('/:id',updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
const Event = require("../../../models/reviewModule/event.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const addEvent = async (req, res) => {
  const { type, startDate, endDate, editor, paperSubmissionDate, reviewTime } =
    req.body;

  try {
    const newEvent = new Event({
      type: type,
      dates: {
        fromDate: startDate,
        toDate: endDate,
      },
      editor: editor,
      paperSubmissionDate: paperSubmissionDate,
      reviewTime: reviewTime,
    });

    await newEvent.save();
    res.status(200).send("New event is created");
  } catch (error) {
    res.status(500).send(error);
  }
};
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).populate('editor').exec();

    res.status(200).send(events);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getEvent = async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.send("id not found");
  } else {
    try {
      const event = await Event.findById(id).populate('editor').exec();
      res.status(200).send(event);
    } catch (error) {
      res.status(500).send(error);
    }
  }
};

const deleteEvent = async (req, res) => {
  const id = req.params.id;
  if (!id) res.send("Id not found");

  try {
    await Event.deleteOne({ _id: id });
    res.status(200).send("Deleted Successfully");
  } catch (error) {
    res.status(500).send(error);
  }
};

const updateEvent = async (req, res) => {
  const id = req.params.id;
  if (!id) res.send("Id not found");

  const updateField = req.body;

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id },
      updateField,
      {
        new: true,
      }
    );
    res.status(200).send(updatedEvent);
  } catch (error) {
    res.status(500).send(error);
  }
};

const addEditor = async (req, res) => {
  const id = req.params.id;
  if (!id) res.send("id not found");
  const newEditor = req.body.editor;

  try {
    const event = await Event.findById(id);
    event.editor.push(newEditor);
    await event.save();

    res.status(200).send("Editor is added successfully");
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = { getEvents, addEvent, getEvent, deleteEvent, updateEvent, addEditor};

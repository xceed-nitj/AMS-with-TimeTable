const Event = require("../../../models/reviewModule/event.js");
const express = require("express");
const bodyParser = require("body-parser");
const { sendMail } = require("../../mailerModule/mailer.js"); // Importing the sendMail function



const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const addEvent = async (req, res) => {
  const { name, startDate, endDate, editor, paperSubmissionDate, reviewTime,instructions } =
    req.body;

  try {
    const newEvent = new Event({
      name:name,
      editor: editor,
      });
    await newEvent.save();
    res.status(200).send(newEvent);
    const event= await Event.findById(newEvent._id).populate('editor').exec();
    if (!event.editor || event.editor.length === 0) {
      console.log("No editors found for the event");
      return;
    }
    console.log(event.editor)
    const editorEmails = event.editor.map(editor => editor.email);
    console.log("Editor Emails:", editorEmails);
    await sendMail(editorEmails, "Welcome to Review Management", `You have been added as editor for the conference "${name}"`);
  } catch (error) {
    res.status(500).send(error);
  }
};
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).populate('editor').exec();
    console.log(events)
    res.status(200).json(events);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getEventsByUser = async (req, res) => {
  const userId = req.user.id;
  try {
    const events = await Event.find({ 'editor': { $in: [userId] } }).exec();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).send(error);
  }
};



const getEventById = async (req, res) => {
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

module.exports = { getEvents,getEventsByUser, addEvent, getEventById, deleteEvent, updateEvent, addEditor};

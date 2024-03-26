const express = require("express");
const Event = require("../../../models/conferenceModule/event");

const EventController = require("../crud/events");

const eventController = new EventController();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const events = await eventController.getAllEvents();
    res.status(200).json(events);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await eventController.getEventById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/conf/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await eventController.getEventByConfId(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newEvent = req.body;
    await eventController.addEvent(newEvent);
    res.status(201).json({ response: "Event created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const updatedEvent = req.body;
    console.log(updatedEvent);
    await eventController.updateEvent(eventId,updatedEvent);
    res.status(200).json({ response: "Event updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    await eventController.deleteEvent(eventId);
    res.status(200).json({ response: "Event deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;


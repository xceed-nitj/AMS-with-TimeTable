const express = require("express");
const EventDateController = require("../crud/eventDate");

const eventDateRouter = express.Router();
const eventDateController = new EventDateController();

// GET /eventDates/conference/:id
eventDateRouter.get("/conference/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const eventDates = await eventDateController.getEventDatesByConferenceId(
      id
    );
    res.status(200).json(eventDates);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// GET /eventDates
eventDateRouter.get("/", async (req, res) => {
  try {
    const allEventDates = await eventDateController.getAllEventDates();
    res.status(200).json(allEventDates);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// GET /eventDates/:id
eventDateRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const eventDate = await eventDateController.getEventDateById(id);
    res.status(200).json(eventDate);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// POST /eventDates
eventDateRouter.post("/", async (req, res) => {
  try {
    const newEventDate = req.body;
    await eventDateController.createEventDate(newEventDate);
    res.status(201).json({ response: "Event Date created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


eventDateRouter.put("/:id", async (req, res) => {
  try {
    await eventDateController.updateEventDate(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /eventDates/:id
eventDateRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await eventDateController.deleteEventDate(id);
    res.status(200).json({ response: "Event Date deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = eventDateRouter;

/**
 * @swagger
 * tags:
 *   name: EventDates
 *   description: API endpoints for Event Dates
 */

/**
 * @swagger
 * /eventDates/conference/{id}:
 *   get:
 *     summary: Get event dates by conference ID
 *     tags: [EventDates]
 *     description: Retrieve event dates based on the conference ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Conference ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Event Date not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /eventDates:
 *   get:
 *     tags: [EventDates]
 *     summary: Get all event dates
 *     description: Retrieve all event dates
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags: [EventDates]
 *     summary: Create a new event date
 *     description: Create a new event date
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventDatesModel'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /eventDates/{id}:
 *   get:
 *     tags: [EventDates]
 *     summary: Get an event date by ID
 *     description: Retrieve an event date by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Event Date ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Event Date not found
 *       500:
 *         description: Internal server error
 *   put:
 *     tags: [EventDates]
 *     summary: Update an event date by ID
 */

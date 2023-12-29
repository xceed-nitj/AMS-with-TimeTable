const express = require("express");
const addEventRouter = express.Router();
const AddEventController = require("../controllers/addevent");
const addEventController = new AddEventController();
const protectRoute =require("../../usermanagement/privateroute")

// Route to create a new event
addEventRouter.post("/", async (req, res) => {
  
  try {
    console.log(req.body); 
    await addEventController.addEvent(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all events
addEventRouter.get("/", async (req, res) => {
  try {
    console.log("Route hit");

    const allEvents = await addEventController.getAllEvents(req,res);
    res.status(200).json(allEvents);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get a specific event by ID
// addEventRouter.get("/:eventId", async (req, res) => {
//   try {
//     const eventId = req.params.eventId;
//     const event = await addEventController.getEventById(eventId);
//     res.status(200).json(event);
//   } catch (e) {
//     res
//       .status(e?.status || 500)
//       .json({ error: e?.message || "Internal Server Error" });
//   }
// });

// Route to update a specific event by ID
addEventRouter.put('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const updatedEvent = req.body;
    await addEventController.updateEvent(eventId, updatedEvent);
    res.status(200).json({ response: "Event updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a specific event by ID
addEventRouter.delete("/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    await addEventController.deleteEventById(eventId);
    res.status(200).json({ response: "Event deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


addEventRouter.get("/getevents", protectRoute, async (req, res) => {
  try {
    console.log("Route hit");
    const user= req.user;
    const allEvents = await addEventController.getEventByUser(user);
    res.status(200).json(allEvents);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});




module.exports = addEventRouter;

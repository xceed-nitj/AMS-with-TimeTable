const express = require("express");
const addEventRouter = express.Router();
const AddEventController = require("../controllers/addevent");
const addEventController = new AddEventController();
const protectRoute = require("../../usermanagement/privateroute");
const ecmadminRoute = require("../../usermanagement/ecmadminroute");
const LockStatus = require("../helper/lockstatus");

// Route to create a new event
addEventRouter.post("/",ecmadminRoute, async (req, res) => {
  try {
    await addEventController.addEvent(req.body);
    return res.status(201).json({ response: "Event created sucesfully" });
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all events
addEventRouter.get("/", async (req, res) => {
  try {
    const allEvents = await addEventController.getAllEvents();
    return res.status(200).json(allEvents);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// // Route to get a specific event by ID
// addEventRouter.get("/:eventId", async (req, res) => {
//   try {
//     const eventId = req.params?.eventId;
//     const event = await addEventController.getEventById(eventId);
//     return res.status(200).json(event);
//   } catch (e) {
//     return res
//       .status(e?.status || 500)
//       .json({ error: e?.message || "Internal Server Error" });
//   }
// });


// Route to update a specific event by ID
addEventRouter.put("/:eventId",ecmadminRoute, async (req, res) => {
  try {
    const eventId = req.params?.eventId;
    const updatedEvent = req.body;
    await addEventController.updateEvent(eventId, updatedEvent);
    return res.status(200).json({ response: "Event updated successfully" });
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


addEventRouter.get("/getevents", ecmadminRoute, async (req, res) => {
  try {
    const user = req?.user?.id;
    const allEvents = await addEventController.getEventByUser(user);
    return res.status(200).json(allEvents);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addEventRouter.post("/lock/:id", ecmadminRoute, async (req, res) => {
  try {
    const eventId = req.params.id;
    await addEventController.lockEvent(eventId);
    return res.status(200).json({message:'Lock succesful'});
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


module.exports = addEventRouter;

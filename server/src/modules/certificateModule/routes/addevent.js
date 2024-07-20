const express = require("express");
const addEventRouter = express.Router();
const AddEventController = require("../controllers/addevent");
const addEventController = new AddEventController();
const protectRoute = require("../../usermanagement/privateroute");
const ecmadminRoute = require("../../usermanagement/ecmadminroute");
const LockStatus = require("../helper/lockstatus");
const { checkRole } = require("../../checkRole.middleware");

// Route to create a new event
addEventRouter.post("/", checkRole(['CM']), async (req, res) => {
  try {
    const { user, ...eventData } = req.body; // extract userId from request body

    
    const userId = req.user.id; 

    
    await addEventController.addEvent({ user: userId, ...eventData });

    return res.status(201).json({ response: "Event created successfully" });
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
addEventRouter.put("/:eventId",checkRole(['CM'],true), async (req, res) => {
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


addEventRouter.get("/getevents", checkRole(['CM']), async (req, res) => {
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

addEventRouter.post("/lock/:id", checkRole(['CM']), async (req, res) => {
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

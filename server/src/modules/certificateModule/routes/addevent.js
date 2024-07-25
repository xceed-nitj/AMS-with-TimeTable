const express = require("express");
const addEventRouter = express.Router();
const AddEventController = require("../controllers/addevent");
const addEventController = new AddEventController();
const protectRoute = require("../../usermanagement/privateroute");
// const ecmadminRoute = require("../../usermanagement/ecmadminroute");
const LockStatus = require("../helper/lockstatus");
const { checkRole } = require("../../checkRole.middleware");
const { issuedCertificates, totalCertificates } = require("../helper/countCertificates");

// Route to create a new event
addEventRouter.post("/", checkRole(['CM','admin']), async (req, res) => {
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

// Route for assigning an event to a specific user
addEventRouter.post('/assignEvent/:userId', checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const eventData = req.body;

    const newEvent = await addEventController.assignEventToUser(eventData, userId);

    return res.status(201).json({ message: "Event assigned successfully", event: newEvent });
  } catch (e) {
    return res.status(e?.status || 500).json({ message: e?.message || "Internal Server Error" });
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
addEventRouter.put("/:eventId",checkRole(['CM','admin'],true), async (req, res) => {
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


addEventRouter.get("/getevents", checkRole(['CM','admin']), async (req, res) => {
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

addEventRouter.get("/getevents/:userId", checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const allEvents = await addEventController.getEventByUser(userId);
    return res.status(200).json(allEvents);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});



addEventRouter.get("/getCertificateCount/:eventid", checkRole(['CM','admin']), async (req, res) => {
  try {
    const eventId = req?.params?.eventid;
    const issuedCount = await issuedCertificates(eventId)
    const totalCount = await totalCertificates(eventId)
    return res.status(200).json({issuedCount,totalCount});
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addEventRouter.post("/lock/:id", checkRole(['CM','admin'],true), async (req, res) => {
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

addEventRouter.post("/unlock/:id", checkRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    await addEventController.unlockEvent(eventId);
    return res.status(200).json({message:'Unlock succesful'});
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addEventRouter.delete("/delete/:id", checkRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    await addEventController.deleteEventById(eventId);
    return res.status(200).json({message:'deleted succesfully'});
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});




module.exports = addEventRouter;

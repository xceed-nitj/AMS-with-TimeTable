const express = require("express");
const router = express.Router();

const addEvent = require("../../../models/certificateModule/addevent");
const participant = require("../../../models/certificateModule/participant");



async function LockStatus(req, res, next) {
  try
  {
    const id = req.params.id;


  const event= await addEvent.find(id)
  let lock;
  if(!event)
  {
    const user= await participant.find(id)
    const event= await addEvent.find(user.eventId)
    lock=event.lock
  }
  else
  {
    lock=event.lock
  }
  if (lock) {
    return res.status(401).json({ message: "Event Locked" });
  }
      next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = LockStatus;

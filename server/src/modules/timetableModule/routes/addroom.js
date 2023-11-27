const express = require("express");
const addRoomRouter = express.Router();
const AddRoomController = require("../controllers/addroomprofile");
const addRoomController = new AddRoomController();
const protectRoute =require("../../usermanagement/privateroute")

addRoomRouter.post("/",protectRoute, async (req, res) => {
    try {
      await addRoomController.AddRoom(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addRoomRouter.get("/", async (req, res) => {
    try {
      await addRoomController.getAddedRoom(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addRoomRouter.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await addRoomController.getAddedRoomById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addRoomRouter.get("/code/:code", async (req, res) => {
    try {
      const currentCode = req.params.code;
      const rooms = await addRoomController.getRooms(currentCode);
      res.status(200).json(rooms);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  addRoomRouter.put('/:id',protectRoute, async (req, res) => {
      try {
        const roomID = req.params.id;
        const updatedId = req.body;
        await addRoomController.updateID(
          roomID,updatedId
        );
        res.status(200).json({ response: "Room updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    addRoomRouter.delete("/:id",protectRoute, async (req, res) => {
      try {
        const roomID = req.params.id;
        await addRoomController.deleteId(roomID);
        res.status(200).json({ response: "Room deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    addRoomRouter.delete("/deletebycode/:code",protectRoute, async (req, res) => {
      try {
        const code = req.params.code;
        await addRoomController.deleteRoomByCode(code);
        res.status(200).json({ response: `Rooms with code ${code} deleted successfully` });
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });



  module.exports = addRoomRouter;

const express = require("express");
const masterroomRouter = express.Router();
const MasterroomController = require("../controllers/masterroomprofile");
const masterroomController = new MasterroomController();

const ttadminRoute = require("../../usermanagement/controllers/ttadminroute");

masterroomRouter.post("/", ttadminRoute, async (req, res) => {
  try {
    await masterroomController.createRoom(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterroomRouter.get("/", async (req, res) => {
  try {
    await masterroomController.getRoom(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterroomRouter.get("/id/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await masterroomController.getRoomById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterroomRouter.get("/dept/:dept", async (req, res) => {
  try {
    const department = req.params.dept;
    const resp = await masterroomController.getRoomByDepartment(department);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterroomRouter.get("/getroom/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const resp = await masterroomController.getRoomByType(type);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterroomRouter.put("/:id", ttadminRoute, async (req, res) => {
  try {
    const roomId = req.params.id;
    const updatedId = req.body;
    await masterroomController.updateID(roomId, updatedId);
    res.status(200).json({ response: "Room updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterroomRouter.delete("/:id", ttadminRoute, async (req, res) => {
  try {
    const roomId = req.params.id;
    await masterroomController.deleteId(roomId);
    res.status(200).json({ response: "Room deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = masterroomRouter;

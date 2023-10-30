const express = require("express");
const allotmentRouter = express.Router();
const AllotmentController = require("../controllers/allotmentprofile");
const allotmentController = new AllotmentController();

allotmentRouter.post("/", async (req, res) => {
    try {
      await allotmentController.AddAllotment(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  allotmentRouter.get("/", async (req, res) => {
    try {
      await allotmentController.getAllotment(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  allotmentRouter.get('/session', async (req, res) => {
    try {
      const sessions = await allotmentController.getSessions(); 
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  allotmentRouter.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await allotmentController.getAllotmentById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  allotmentRouter.put('/:id', async (req, res) => {
      try {
        const allotmentID = req.params.id;
        const updatedId = req.body;
        await allotmentController.updateID(
          allotmentID,updatedId
        );
        res.status(200).json({ response: "Allotment updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    allotmentRouter.delete("/:id", async (req, res) => {
      try {
        const allotmentID = req.params.id;
        await allotmentController.deleteId(allotmentID);
        res.status(200).json({ response: "Allotment deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

  module.exports = allotmentRouter;

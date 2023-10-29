const express = require("express");
const addSemRouter = express.Router();
const AddSemController = require("../controllers/addsemprofile");
const addSemController = new AddSemController();

addSemRouter.post("/", async (req, res) => {
    try {
      await addSemController.AddSem(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addSemRouter.get("/", async (req, res) => {
    try {
      await addSemController.getAddedSem(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addSemRouter.get('/sem', async (req, res) => {
    try {
      const sem = await addSemController.getSem(); 
      res.status(200).json(sem);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  addSemRouter.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await addSemController.getAddedSemById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addSemRouter.put('/:id', async (req, res) => {
      try {
        const semID = req.params.id;
        const updatedId = req.body;
        await addSemController.updateID(
          semID,updatedId
        );
        res.status(200).json({ response: "Room updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    addSemRouter.delete("/:id", async (req, res) => {
      try {
        const semID = req.params.id;
        await addSemController.deleteId(semID);
        res.status(200).json({ response: "Room deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });



  module.exports = addSemRouter;

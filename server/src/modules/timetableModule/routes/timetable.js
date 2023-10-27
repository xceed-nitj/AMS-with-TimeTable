const express = require("express");
const TableRouter = express.Router();
const TableController = require("../controllers/timetableprofile");
const tableController = new TableController();


TableRouter.get("/", async (req, res) => {
  try {
    await tableController.getUserTable(req,res) ;
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


TableRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await tableController.getTableById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.post("/", async (req, res) => {
    try { 
      await tableController.createTable(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  TableRouter.put('/:id', async (req, res) => {
    try {
      const tableId = req.params.id;
      const updatedId = req.body;
      await tableController.updateID(
        tableId,updatedId
      );
      res.status(200).json({ response: "ID updated successfully" });
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  TableRouter.delete("/:id", async (req, res) => {
    try {
      const tableId = req.params.id;
      await tableController.deleteId(tableId);
      res.status(200).json({ response: "ID deleted successfully" });
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  module.exports = TableRouter;
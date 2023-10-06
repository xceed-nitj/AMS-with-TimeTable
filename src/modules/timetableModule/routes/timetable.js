const express = require("express");
const TableRouter = express.Router();
const TableController = require("../controllers/timetableprofile");
const tableController = new TableController();

TableRouter.post("/", async (req, res) => {
    try {
     
      await tableController.createTable(req, res);
      
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  TableRouter.get("/", async (req, res) => {
    try {
      await tableController.getTable(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


  module.exports = TableRouter;

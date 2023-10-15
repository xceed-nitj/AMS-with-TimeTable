const express = require("express");
const ClassTimeTableRouter = express.Router();
const ClassTimeTableController = require("../controllers/classtimetable");
const classtimetableController = new ClassTimeTableController();


ClassTimeTableRouter.post("/savett", async (req, res) => {
    try { 
      await classtimetableController.savett(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  ClassTimeTableRouter.get("/facultytt/:facultyname", async (req, res) => {
    try { 
      await classtimetableController.facultytt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });



  module.exports = ClassTimeTableRouter;
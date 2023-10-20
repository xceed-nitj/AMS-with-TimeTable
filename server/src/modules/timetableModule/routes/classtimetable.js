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

  ClassTimeTableRouter.post("/saveslot/:day/:slot", async (req, res) => {
    try { 
      await classtimetableController.saveslot(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });




  ClassTimeTableRouter.get("/viewclasstt/:code/:sem", async (req, res) => {
    try { 
      await classtimetableController.classtt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });



  ClassTimeTableRouter.get("/viewfacultytt/:code/:facultyname", async (req, res) => {
    try { 
      await classtimetableController.facultytt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  ClassTimeTableRouter.get("/viewroomtt/:code/:room", async (req, res) => {
    try { 
      await classtimetableController.roomtt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


  module.exports = ClassTimeTableRouter;
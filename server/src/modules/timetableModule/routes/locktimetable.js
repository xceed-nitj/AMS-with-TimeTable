const express = require("express");
const LockTimeTableRouter = express.Router();
const LockTimeTableController = require("../controllers/locktimetable");
const locktimetableController = new LockTimeTableController();


LockTimeTableRouter.post("/locktt", async (req, res) => {
    try { 
      await locktimetableController.locktt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  
  LockTimeTableRouter.get("/lockclasstt/:code/:sem", async (req, res) => {
    try { 
      await locktimetableController.classtt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });



  LockTimeTableRouter.get("/lockfacultytt/:code/:facultyname", async (req, res) => {
    try { 
      await locktimetableController.facultytt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  LockTimeTableRouter.get("/lockroomtt/:code/:room", async (req, res) => {
    try { 
      await locktimetableController.roomtt(req, res);
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


// view timetable final

LockTimeTableRouter.get("/viewsem/:degree/:dept/:sem", async (req, res) => {
  try { 
    await locktimetableController.classtt(req, res);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});



LockTimeTableRouter.get("/viewfaculty/:session/:faculty", async (req, res) => {
  try { 
    await locktimetableController.facultytt(req, res);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

LockTimeTableRouter.get("/viewroom/:session/:room", async (req, res) => {
  try { 
    await locktimetableController.roomtt(req, res);
  } 
  catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});



  module.exports = LockTimeTableRouter;
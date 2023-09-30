const express = require("express");
const studentRouter = express.Router();
const StudentController = require("../controllers/semtable");
const studentController = new StudentController();


studentRouter.post("/", async (req, res) => {
    try {
      await studentController.createTimetableEntry(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  


  module.exports = studentRouter;

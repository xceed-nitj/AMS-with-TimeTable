const express = require("express");
const facultyRouter = express.Router();
const FacultyController = require("../controllers/facultyprofile");
const facultyController = new FacultyController();

facultyRouter.post("/", async (req, res) => {
    try {
      await facultyController.createFaculty(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  facultyRouter.get("/", async (req, res) => {
    try {
      await facultyController.getFaculty(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


  module.exports = facultyRouter;

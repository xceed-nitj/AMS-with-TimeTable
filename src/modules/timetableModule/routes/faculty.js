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

    facultyRouter.put('/a', async (req, res) => {
      try {
        const announcementId = req.params.id;
        console.log(req.body);
        const updatedAnnouncement = req.body;
        await facultyController.updateAnnouncement(
          announcementId,
          updatedAnnouncement
        );
        res.status(200).json({ response: "Announcement updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });
  });


  module.exports = facultyRouter;

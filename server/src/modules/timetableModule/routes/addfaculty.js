const express = require("express");
const addFacultyRouter = express.Router();
const AddFacultyController = require("../controllers/addfacultyprofile");
const addFacultyController = new AddFacultyController();

addFacultyRouter.post("/", async (req, res) => {
    try {
      await addFacultyController.AddFaculty(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addFacultyRouter.get("/", async (req, res) => {
    try {
      await addFacultyController.getAddedFaculty(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addFacultyRouter.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await addFacultyController.getAddedFacultyById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  addFacultyRouter.put('/:id', async (req, res) => {
      try {
        const facultyId = req.params.id;
        const updatedId = req.body;
        await addFacultyController.updateID(
          facultyId,updatedId
        );
        res.status(200).json({ response: "ID updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    addFacultyRouter.delete("/:id", async (req, res) => {
      try {
        const facultyId = req.params.id;
        await addFacultyController.deleteId(facultyId);
        res.status(200).json({ response: "ID deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });



  module.exports = addFacultyRouter;

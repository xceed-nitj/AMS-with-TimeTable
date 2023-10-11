const express = require("express");
const subjectRouter = express.Router();
const SubjectController = require("../controllers/subjectprofile");
const subjectController = new SubjectController();


subjectRouter.post("/", async (req, res) => {
    try {
      await subjectController.createTimetableEntry(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  subjectRouter.get("/", async (req, res) => {
    try {
      await subjectController.getSubject(req,res) ;
    } 
    catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });
   
  subjectRouter.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await subjectController.getSubjectById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  subjectRouter.put('/:id', async (req, res) => {
    try {
      const subjectId = req.params.id;
      const updatedId = req.body;
      await subjectController.updateID(
        subjectId,updatedId
      );
      res.status(200).json({ response: "ID updated successfully" });
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });
  
  subjectRouter.delete("/:id", async (req, res) => {
    try {
      const subjectId = req.params.id;
      await subjectController.deleteId(subjectId );
      res.status(200).json({ response: "ID deleted successfully" });
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


  module.exports = subjectRouter;

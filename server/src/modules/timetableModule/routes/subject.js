const express = require("express");
const subjectRouter = express.Router();
const SubjectController = require("../controllers/subjectprofile");
const subjectController = new SubjectController();
const protectRoute =require("../../usermanagement/privateroute")



subjectRouter.post("/",protectRoute, async (req, res) => {
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

  subjectRouter.get("/sem", async (req, res) => {
    try {
      const sems = await subjectController.getSem(); 
      res.status(200).json(sems);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
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

  subjectRouter.get("/filteredsubject/:code/:sem", async (req, res) => {
    try {
      const code=req.params.code;
      const sem=req.params.sem;
      const subjects = await subjectController.getFilteredSubject(code,sem); 
      res.status(200).json(subjects);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  subjectRouter.get("/subjectdetails/:code", async (req, res) => {
    try {
      const code=req.params.code;
      // const sub=req.params.subname;
      const subjects = await subjectController.getSubjectBySession(code); 
      // console.log("subject ocde", subjects)

      res.status(200).json(subjects);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  subjectRouter.get("/code/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const subject = await subjectController.getSubjectByCode(code);
      res.status(200).json(subject);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  subjectRouter.delete("/deletebycode/:code", async (req, res) => {
    try {
      const code = req.params.code;
      await subjectController.deleteSubjectsByCode(code);
      res.status(200).json({ response: `Subjects with code ${code} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
 


  module.exports = subjectRouter;

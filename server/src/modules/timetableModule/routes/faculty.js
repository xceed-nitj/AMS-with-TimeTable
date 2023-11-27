const express = require("express");
const facultyRouter = express.Router();
const FacultyController = require("../controllers/facultyprofile");
const facultyController = new FacultyController();

const ttadminRoute=require("../../usermanagement/ttadminroute")
const protectRoute =require("../../usermanagement/privateroute")


facultyRouter.post("/",ttadminRoute,protectRoute, async (req, res) => {
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

  facultyRouter.get('/dept', async (req, res) => {
    try {
      const departments = await facultyController.getDepartments(); 
      res.status(200).json(departments);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  facultyRouter.get("/id/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await facultyController.getFacultyById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });
  
  facultyRouter.get("/dept/:dept", async (req, res) => {
    try {
      const department = req.params.dept;
      const resp = await facultyController.getFacultyByDepartment(department);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });
  
    facultyRouter.put('/:id',ttadminRoute, async (req, res) => {
      try {
        const facultyId = req.params.id;
        const updatedId = req.body;
        await facultyController.updateID(
          facultyId,updatedId
        );
        res.status(200).json({ response: "ID updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    facultyRouter.delete("/:id",ttadminRoute, async (req, res) => {
      try {
        const facultyId = req.params.id;
        await facultyController.deleteId(facultyId);
        res.status(200).json({ response: "ID deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

  module.exports = facultyRouter;

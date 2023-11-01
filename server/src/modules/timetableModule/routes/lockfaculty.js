const express = require("express");
const LockFacultyRouter = express.Router();
const LockFacultyController = require("../controllers/lockfaculty");
const lockFacultyController = new LockFacultyController();


LockFacultyRouter.post("/", async (req, res) => {
    try {
      await lockFacultyController.lockFaculty(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  LockFacultyRouter.get("/", async (req, res) => {
    try {
      await lockFacultyController.getlockFaculty(req,res) ;
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

    LockFacultyRouter.put('/:id', async (req, res) => {
      try {
        const lockfacultyId = req.params.id;
        const updatedId = req.body;
        await lockFacultyController.updateID(
          lockfacultyId,updatedId
        );
        res.status(200).json({ response: "ID updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

    LockFacultyRouter.delete("/:id", async (req, res) => {
      try {
        const lockfacultyId = req.params.id;
        await lockFacultyController.deleteId(lockfacultyId);
        res.status(200).json({ response: "ID deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });


  module.exports = LockFacultyRouter;
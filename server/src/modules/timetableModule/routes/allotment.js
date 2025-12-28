const express = require("express");
const allotmentRouter = express.Router();
const AllotmentController = require("../controllers/allotmentprofile");
const allotmentController = new AllotmentController();

allotmentRouter.post("/", async (req, res) => {
    try {
      await allotmentController.AddAllotment(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  // FIXED: Remove the duplicate response
  allotmentRouter.get("/", async (req, res) => {
    try {
      await allotmentController.getAllotment(req, res);
      // REMOVED: res.status(200).json(list); 
      // The controller already sends the response
    } catch (e) {
      if (!res.headersSent) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    }
  });

  allotmentRouter.get('/session', async (req, res) => {
    try {
      const sessions = await allotmentController.getSessions(); 
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  allotmentRouter.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resp = await allotmentController.getAllotmentById(id);
      res.status(200).json(resp);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  allotmentRouter.put('/session/:sessionId', async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const newSession = req.body.session;
  
      await allotmentController.updateSession(sessionId, newSession);
  
      res.status(200).json({ message: 'Session updated successfully' });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  allotmentRouter.put('/:id', async (req, res) => {
      try {
        const allotmentID = req.params.id;
        const updatedId = req.body;
        await allotmentController.updateID(
          allotmentID,updatedId
        );
        res.status(200).json({ response: "Allotment updated successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

 allotmentRouter.post("/set-current-session", async (req, res) => {
  await allotmentController.setCurrentSession(req, res);
});

allotmentRouter.get("/current-status", async (req, res) => {
  await allotmentController.getCurrentStatus(req, res);
});

    allotmentRouter.delete("/session/:session", async (req, res) => {
      try {
        const session = req.params.session; 
        await allotmentController.deleteBySession(session);
        res.status(200).json({ response: "Allotment deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });
    
    allotmentRouter.delete("/:id", async (req, res) => {
      try {
        const allotmentID = req.params.id;
        await allotmentController.deleteId(allotmentID);
        res.status(200).json({ response: "Allotment deleted successfully" });
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    });

  module.exports = allotmentRouter;
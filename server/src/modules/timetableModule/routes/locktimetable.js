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

  module.exports = LockTimeTableRouter;
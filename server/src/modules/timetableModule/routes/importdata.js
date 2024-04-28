const express = require("express");
const importRouter = express.Router();
const ImportController = require("../controllers/importdata");
const importController = new ImportController();

importRouter.post("/centralallotment", async (req, res) => {
    try {
      await importController.importInstituteRoomAllocation(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });

  module.exports = importRouter;

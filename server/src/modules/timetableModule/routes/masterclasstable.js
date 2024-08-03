const express = require("express");
const masterTableRouter = express.Router();
const MasterclasstableController = require("../controllers/masterclasstable");
const masterClassTableController = new MasterclasstableController();

const ttadminRoute=require("../../usermanagement/ttadminroute")


// mastersemRouter.use(["/","/:id"], customMiddleware);



masterTableRouter.get("/", async (req, res) => {
  try {
    await masterClassTableController.getMasterTable(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


masterTableRouter.get("/session/:session", async (req, res) => {
  try {
    await masterClassTableController.getMasterTableBySession(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

masterTableRouter.get("/", async (req, res) => {
  try {
    await masterClassTableController.getMasterTableByDepartment(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = masterTableRouter;

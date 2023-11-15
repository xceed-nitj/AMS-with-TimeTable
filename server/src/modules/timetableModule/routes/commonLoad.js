const express = require("express");
const commonLoadRouter = express.Router();
const CommonLoadController = require("../controllers/commonLoadprofile");
const commonLoadController = new CommonLoadController();

commonLoadRouter.post("/", async (req, res) => {
  try {
    await commonLoadController.createCommonLoad(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

commonLoadRouter.get("/", async (req, res) => {
  try {
    await commonLoadController.getAllCommonLoads(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

commonLoadRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await commonLoadController.getCommonLoadById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

commonLoadRouter.get("/code/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const loads = await commonLoadController.getCommonLoadByCode(code);
      res.status(200).json(loads);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  commonLoadRouter.get("/Session/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const commonLoads = await commonLoadController.getCommonLoadBySession(code);
      res.status(200).json(commonLoads);
    } catch (e) {
      res
        .status(500)
        .json({ error: e.message || "Internal Server Error" });
    }
  });
  

commonLoadRouter.put('/:id', async (req, res) => {
  try {
    const commonLoadID = req.params.id;
    const updatedData = req.body;
    await commonLoadController.updateCommonLoad(commonLoadID, updatedData);
    res.status(200).json({ response: "CommonLoad updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

commonLoadRouter.delete("/:id", async (req, res) => {
  try {
    const commonLoadID = req.params.id;
    await commonLoadController.deleteCommonLoad(commonLoadID);
    res.status(200).json({ response: "CommonLoad deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = commonLoadRouter;





















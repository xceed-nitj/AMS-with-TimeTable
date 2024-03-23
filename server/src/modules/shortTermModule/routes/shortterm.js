const express = require("express");
const shortTermRouter = express.Router();
const ShortTermController = require("../controllers/shortterm");
const shortTermController = new ShortTermController();
const protectRoute = require("../../usermanagement/privateroute");

// Route to create a new ShortTerm
shortTermRouter.post("/", async (req, res) => {
  try {
    await shortTermController.createShortTerm(req.body);
    return res.status(201).json({ response: "ShortTerm created successfully" });
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all ShortTerms
shortTermRouter.get("/", async (req, res) => {
  try {
    const allShortTerms = await shortTermController.getAllShortTerms();
    return res.status(200).json(allShortTerms);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get a specific ShortTerm by ID
shortTermRouter.get("/:shortTermId", async (req, res) => {
  try {
    const shortTermId = req.params?.shortTermId;
    const shortTerm = await shortTermController.getShortTermById(shortTermId);
    return res.status(200).json(shortTerm);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to update a specific ShortTerm by ID
shortTermRouter.put("/:shortTermId", async (req, res) => {
  try {
    const shortTermId = req.params?.shortTermId;
    const updatedShortTerm = req.body;
    await shortTermController.updateShortTermById(shortTermId, updatedShortTerm);
    return res.status(200).json({ response: "ShortTerm updated successfully" });
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a specific ShortTerm by ID
shortTermRouter.delete("/:shortTermId", async (req, res) => {
  try {
    const shortTermId = req.params?.shortTermId;
    await shortTermController.deleteShortTermById(shortTermId);
    return res.status(200).json({ response: "ShortTerm deleted successfully" });
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


module.exports = shortTermRouter;

const express = require("express");
const Souvenir = require("../../../models/conferenceModule/souvenir");

const SouvenirController = require("../crud/souvenir");

const souvenirController = new SouvenirController();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const souvenirs = await souvenirController.getAllSouvenirs();
    res.status(200).json(souvenirs);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await souvenirController.getSouvenirById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/conf/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await souvenirController.getSouvenirByConfId(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newSouvenir = req.body;
    await souvenirController.addSouvenir(newSouvenir);
    res.status(201).json({ response: "Souvenir created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const souvenirId = req.params.id;
    const updatedSouvenir = req.body;
    console.log(updatedSouvenir);
    await souvenirController.updateSouvenir(souvenirId,updatedSouvenir);
    res.status(200).json({ response: "Souvenir updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const souvenirId = req.params.id;
    await souvenirController.deleteSouvenir(souvenirId);
    res.status(200).json({ response: "Souvenir deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;


const express = require("express");
const Accomodation = require("../../../models/conferenceModule/accomodation");

const AccomodationController = require("../crud/accomodation");
const { checkRole } = require("../../checkRole.middleware");

const accomodationController = new AccomodationController();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const accomodations = await accomodationController.getAllAccomodations();
    res.status(200).json(accomodations);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await accomodationController.getAccomodationById(id);
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
    const resp = await accomodationController.getAccomodationByConfId(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.post("/", checkRole(['EO']),async (req, res) => {
  try {
    const newAccomodation = req.body;
    await accomodationController.addAccomodation(newAccomodation);
    res.status(201).json({ response: "Accomodation created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const accomodationId = req.params.id;
    const updatedAccomodation = req.body;
    console.log(updatedAccomodation);
    await accomodationController.updateAccomodation(accomodationId,updatedAccomodation);
    res.status(200).json({ response: "Accomodation updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.delete("/:id", checkRole(['EO']),async (req, res) => {
  try {
    const accomodationId = req.params.id;
    await accomodationController.deleteAccomodation(accomodationId);
    res.status(200).json({ response: "Accomodation deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;
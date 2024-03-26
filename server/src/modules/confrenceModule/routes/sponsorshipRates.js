const express = require("express");
const SponsorshipRate = require("../../../models/conferenceModule/sponsorshipRates");

const SponsorshipRateController = require("../crud/sponsorshipRates");

const sponsorshipRateController = new SponsorshipRateController();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const sponsorshipRates = await sponsorshipRateController.getAllSponsorshipRates();
    res.status(200).json(sponsorshipRates);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await sponsorshipRateController.getSponsorshipRateById(id);
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
    const resp = await sponsorshipRateController.getSponsorshipRateByConfId(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newSponsorshipRate = req.body;
    await sponsorshipRateController.addSponsorshipRate(newSponsorshipRate);
    res.status(201).json({ response: "SponsorshipRate created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const sponsorshipRateId = req.params.id;
    const updatedSponsorshipRate = req.body;
    console.log(updatedSponsorshipRate);
    await sponsorshipRateController.updateSponsorshipRate(sponsorshipRateId,updatedSponsorshipRate);
    res.status(200).json({ response: "SponsorshipRate updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const sponsorshipRateId = req.params.id;
    await sponsorshipRateController.deleteSponsorshipRate(sponsorshipRateId);
    res.status(200).json({ response: "SponsorshipRate deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;


const express = require("express");
const { Request, Response } = require("express");
const Location = require("../models/location");
const LocationController = require("../crud/location");

const router = express.Router();
const locationController = new LocationController();

router.get("/:confId", async (req, res) => {
  try {
    const { confId } = req.params;
    if (!confId) {
      res.status(400).json({ message: "Conference ID is required" });
      return;
    }
    const locations = await locationController.getLocation(confId);
    if (!locations) {
      res.status(404).json({ message: "No locations found" });
      return;
    }
    res.status(200).json(locations);
  } catch (e) {
    console.error("Error fetching locations:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.meta?.cause || "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newLocation = req.body;
    if (!newLocation.confId) {
      res.status(400).json({ message: "Conference ID is required" });
      return;
    }
    const location = await locationController.addLocation(newLocation);
    res.status(201).json(location);
  } catch (e) {
    console.error("Error adding location:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.meta?.cause || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedLocation = req.body;
    if (!updatedLocation.confId) {
      res.status(400).json({ message: "Conference ID is required" });
      return;
    }
    const location = await locationController.updateLocation(
      id,
      updatedLocation
    );
    res.status(200).json(location);
  } catch (e) {
    console.error("Error updating location:", e);
    res.status(500).json({ error: e?.meta?.cause || "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await locationController.deleteLocation(id);
    res.status(200).json({ message: "Location deleted successfully" });
  } catch (e) {
    console.error("Error deleting location:", e);
    res.status(500).json({ error: e?.meta?.cause || "Internal Server Error" }); 
  }
});

module.exports = router;

const express = require("express");
const { Request, Response } = require("express");
const Image = require("../models/images");
const ImagesController = require("../crud/images");

const router = express.Router();
const imagesController = new ImagesController();

router.get("/:id", async (req, res) => {
  try {
    const images = await imagesController.getImagesByConfId(req.params.id);
    res.status(200).json(images);
  } catch (e) {
    console.error("Error fetching images:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.meta?.cause || "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const image = req.body;
    await imagesController.addImage(image);
    res.status(201).json({ response: "Image Added Successfully" });
  } catch (e) {
    console.error("Error adding image:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.meta?.cause || "Internal server error" });
  }
});

router.put("/:imgID", async (req, res) => {
  try {
    const image = req.body;
    const id = req.params.imgID;
    await imagesController.updateImage(id, image);
    res.status(200).json({ response: "Image Updated Successfully" });
  } catch (e) {
    console.error("Error updating image:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.meta?.cause || "Internal server error" });
  }
});

router.delete("/:imgID", async (req, res) => {
  try {
    await imagesController.deleteImage(req.params.imgID);
    res.status(200).json({ response: "Image Deleted Successfully" });
  } catch (e) {
    console.error("Error deleting image:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.meta?.cause || "Internal server error" });
  }
});

module.exports = router;

const express = require("express");
const ImagesController = require("../crud/images"); // Change to the appropriate images controller

const imagesRouter = express.Router();
const imagesController = new ImagesController();

// GET /images/conference/:id
imagesRouter.get("/conference/:id", async (req, res) => {
  try {
    await imagesController.getImagesByConferenceId(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /images
imagesRouter.get("/", async (req, res) => {
  try {
    await imagesController.getAllImages(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /images/:id
imagesRouter.get("/:id", async (req, res) => {
  try {
    await imagesController.getImageById(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /images
imagesRouter.post("/", async (req, res) => {
  try {
    await imagesController.createImage(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /images/:id
imagesRouter.put("/:id", async (req, res) => {
  try {
    await imagesController.updateImage(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /images/:id
imagesRouter.delete("/:id", async (req, res) => {
  try {
    await imagesController.deleteImage(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = imagesRouter;

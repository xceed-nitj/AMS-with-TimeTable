const express = require("express");
const { Request, Response } = require("express");
const Home = require("../../../models/conferenceModule/home");
const HomeController = require("../crud/home");

const router = express.Router();
const homeController = new HomeController();
const { checkRole } = require("../../checkRole.middleware");

router.get("/", async (req, res) => {
  try {
    const homeData = await homeController.getHome();
    res.status(200).json(homeData);
  } catch (e) {
    console.error("Error getting home data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const homeData = await homeController.getHomeById(req.params.id);
    res.status(200).json(homeData);
  } catch (e) {
    console.error("Error getting home data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/conf/:id", async (req, res) => {
  try {
    const homeData = await homeController.getHomeByConfId(req.params.id);
    res.status(200).json(homeData);
  } catch (e) {
    console.error("Error getting home data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.post("/",checkRole(['EO']), async (req, res) => {
  try {
    const newHome = req.body;
    await homeController.addHome(newHome);
    res.status(201).json({ response: "Home Added Successfully" });
  } catch (e) {
    console.error("Error adding home data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedHome = req.body;
    await homeController.updateHome(updatedHome, req.params.id);
    res.status(200).json({ response: "Home Updated Successfully" });
  } catch (e) {
    console.error("Error updating home data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/:id",checkRole(['EO']), async (req, res) => {
  try {
    await homeController.deleteHome(req.params.id);
    res.status(200).json({ response: "Home Deleted Successfully" });
  } catch (e) {
    console.error("Error deleting home data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/about/:confId", async (req, res) => {
  try {
    const { confId } = req.params;
    const homeData = await Home.findOne({ confId }, "about");
    if (!homeData) {
      return res.status(404).json({ error: "Conference not found" });
    }
    res.status(200).json(homeData.about);
  } catch (e) {
    console.error("Error getting about data:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.post("/about/:confId", checkRole(["EO"]), async (req, res) => {
  try {
    const { confId } = req.params;
    const { title, description } = req.body;

    const homeData = await Home.findOne({ confId });
    if (!homeData) {
      return res.status(404).json({ error: "Conference not found" });
    }

    homeData.about.push({ title, description });
    await homeData.save();

    res.status(201).json({ response: "About section added successfully" });
  } catch (e) {
    console.error("Error adding about section:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/about/:confId/:aboutId", checkRole(["EO"]), async (req, res) => {
    const { confId, aboutId } = req.params;

    try {
        // Find the conference home entry
        const homeData = await Home.findOne({ confId });

        if (!homeData) {
            return res.status(404).json({ error: "Conference not found" });
        }

        // Remove the about section with the specified ID
        const updatedAbout = homeData.about.filter(item => item._id.toString() !== aboutId);

        if (updatedAbout.length === homeData.about.length) {
            return res.status(404).json({ error: "About item not found" });
        }

        homeData.about = updatedAbout;
        await homeData.save();

        res.status(200).json({ response: "About item deleted successfully", data: homeData.about });
    } catch (error) {
        console.error("Error deleting about item:", error);
        res.status(error?.code || 500).json({ error: error?.message || "Internal server error" });
    }
});


router.put("/about/:confId", checkRole(["EO"]), async (req, res) => {
    const { confId } = req.params;
    const { about } = req.body;

    try {
        const homeData = await Home.findOneAndUpdate(
            { confId },
            { $set: { about } },
            { new: true, runValidators: true }
        );

        if (!homeData) {
            return res.status(404).json({ error: "Conference not found" });
        }

        res.status(200).json({ response: "About sections updated successfully", data: homeData.about });
    } catch (error) {
        console.error("Error updating about sections:", error);
        res.status(error?.code || 500).json({ error: error?.message || "Internal server error" });
    }
});

module.exports = router;

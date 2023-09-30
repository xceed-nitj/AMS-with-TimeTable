const express = require("express");
const NavbarController = require("../crud/navbar");

const router = express.Router();
const Navbar = new NavbarController();

router.get("/", async (req, res) => {
  try {
    const navbarItems = await Navbar.getNavbar();
    res.status(200).json(navbarItems);
  } catch (e) {
    console.error("Error retrieving navbar items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const navbarItem = await Navbar.getNavbarById(id);
    res.status(200).json(navbarItem);
  } catch (e) {
    console.error("Error retrieving navbar items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/conf/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const navbarItem = await Navbar.getNavbarByConfId(id);
    res.status(200).json(navbarItem);
  } catch (e) {
    console.error("Error retrieving navbar items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const navbarItem = req.body;
    await Navbar.addNavbar(navbarItem);
    res.status(201).json({ success: "Navbar item added successfully" });
  } catch (e) {
    console.error("Error adding navbar item:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const navbarItem = req.body;
    await Navbar.updateNavbar(navbarItem, id);
    res.status(200).json({ success: "Navbar item updated successfully" });
  } catch (e) {
    console.error("Error retrieving navbar items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Navbar.deleteNavbar(id);
    res.status(200).json({ success: "Navbar item deleted successfully" });
  } catch (e) {
    console.error("Error retrieving navbar items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

module.exports = router;

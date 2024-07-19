const express = require("express");
const NavbarController = require("../crud/navbar");

const router = express.Router();
const Navbar = new NavbarController();
const { checkRole } = require("../../checkRole.middleware");

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

router.post("/", checkRole(['EO']), async (req, res) => {
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
    const updated=await Navbar.updateNavbar(navbarItem, id);
    if(!updated){
      res.status(200).json({ success: "Navbar item not found" });    
    }else 
    res.status(200).json({ success: "Navbar item updated successfully" });    
  } catch (e) {
    console.error("Error retrieving navbar items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/:id", checkRole(['EO']), async (req, res) => {
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

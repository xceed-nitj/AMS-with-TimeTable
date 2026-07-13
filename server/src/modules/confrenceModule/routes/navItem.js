const express = require("express");
const NavItemController = require("../crud/navItem");
const { checkRole } = require("../../checkRole.middleware");

const router = express.Router();
const navItemController = new NavItemController();

// Unauthenticated: consumed by the external conference-site frontend to
// render the navbar (mode + ordered items) in a single call.
router.get("/public/:confId", async (req, res) => {
  try {
    const data = await navItemController.getPublicNavbar(req.params.confId);
    res.status(200).json(data);
  } catch (e) {
    console.error("Error retrieving public navbar:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

// Admin panel: all nav items for a conference
router.get("/conf/:confId", async (req, res) => {
  try {
    const items = await navItemController.getNavItemsByConfId(req.params.confId);
    res.status(200).json(items);
  } catch (e) {
    console.error("Error retrieving nav items:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await navItemController.getNavItemById(req.params.id);
    res.status(200).json(item);
  } catch (e) {
    console.error("Error retrieving nav item:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.post("/", checkRole(["EO"]), async (req, res) => {
  try {
    const created = await navItemController.createNavItem(req.body);
    res.status(201).json(created);
  } catch (e) {
    console.error("Error creating nav item:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

// Must be declared before PUT "/:id" so the literal path wins.
router.put("/reorder", checkRole(["EO"]), async (req, res) => {
  try {
    const result = await navItemController.reorderNavItems(req.body?.items);
    res.status(200).json(result);
  } catch (e) {
    console.error("Error reordering nav items:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.put("/mode/:confId", checkRole(["EO"]), async (req, res) => {
  try {
    const updated = await navItemController.setNavbarMode(
      req.params.confId,
      req.body?.navbarMode
    );
    res.status(200).json(updated);
  } catch (e) {
    console.error("Error setting navbar mode:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:id", checkRole(["EO"]), async (req, res) => {
  try {
    const updated = await navItemController.updateNavItem(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (e) {
    console.error("Error updating nav item:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/:id", checkRole(["EO"]), async (req, res) => {
  try {
    await navItemController.deleteNavItem(req.params.id);
    res.status(200).json({ success: "Nav item deleted successfully" });
  } catch (e) {
    console.error("Error deleting nav item:", e);
    res.status(e?.code || 500).json({ error: e?.message || "Internal server error" });
  }
});

module.exports = router;

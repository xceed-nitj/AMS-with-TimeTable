const express = require("express");
const { addGamification, getAllGamifications, getGamificationById, updateGamification, deleteGamification } = require("../controllers/gamification");

const router = express.Router();

router.post("/add", addGamification);
router.get("/all", getAllGamifications);
router.get("/:id", getGamificationById);
router.patch("/:id", updateGamification);
router.delete("/:id", deleteGamification);

module.exports = router;
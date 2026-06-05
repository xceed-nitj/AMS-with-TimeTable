const express = require("express");
const router = express.Router();
const { getGuide, updateGuide } = require("../controller/guide");
const protectRoute = require("../../usermanagement/privateroute");

router.get("/", getGuide);
router.put("/", protectRoute, updateGuide);

module.exports = router;

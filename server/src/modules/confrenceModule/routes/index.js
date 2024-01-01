const express = require("express");
const router = express.Router();


router.use("/navbar", require("./navbar"));
router.use("/announcements", require("./announcements"));

router.use("/speakers", require("./speakers")); // Include speakers routes
router.use("/images", require("./images")); // Include images routes
router.use("/home", require("./home")); // Include home routes
router.use("/eventDates", require("./eventDates")); // Include eventDates routes
router.use("/contactUs", require("./contactUs")); // Include contactUs routes
router.use("/conf", require("./conf")); // Include conf routes
router.use("/committee", require("./committee")); // Include committee routes
router.use("/awards", require("./awards")); // Include awards routes
router.use("/location", require("./location"));
// Add more routes as needed
router.use("/sponsor", require("./sponsor"));

module.exports = router;

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
router.use("/commontemplate", require("./commontemplate"));

// Add more routes as needed
router.use("/sponsor", require("./sponsor"));
router.use("/participant", require("./participant"));
router.use("/event", require("./events"));
router.use("/souvenir", require("./souvenir"));
router.use("/sponsorship-rates", require("./sponsorshipRates"));
router.use("/accomodation", require("./accomodation"));
router.use("/upload", require("./upload"));


module.exports = router;

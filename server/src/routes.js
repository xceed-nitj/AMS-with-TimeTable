const express = require("express");
const v1router = express.Router();

// v1 Routes
const certificateModule = require("./modules/certificateModule/routes/index");
v1router.use("/certificatemodule", certificateModule);

const conferenceModule = require("./modules/confrenceModule/routes/index");
v1router.use("/conferencemodule", conferenceModule);

const timetableModule = require("./modules/timetableModule/routes/index");
v1router.use("/timetablemodule", timetableModule);

const quizModule = require("./modules/quizModule/faculty/routes/index");
v1router.use("/quizmodule", quizModule);

const uploadModule = require("./modules/uploadModule/upload");
v1router.use("/upload", uploadModule);

const attendanceModule = require("./modules/attendanceModule/routes/index");
v1router.use("/attendancemodule", attendanceModule);

const reviewModule = require("./modules/reviewModule/routes/index");
v1router.use("/reviewmodule", reviewModule);

const usermanagementModule = require("./modules/usermanagement/routes/routes");
v1router.use("/auth", usermanagementModule);

const newusermanagementModule = require("./modules/usermanagement/routes/index");
v1router.use("/user", newusermanagementModule);

module.exports = v1router;

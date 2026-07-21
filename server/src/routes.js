const express = require("express");
const v1router = express.Router();

// v1 Routes
const certificateModule = require("./modules/certificateModule/routes/index");
v1router.use("/certificatemodule", certificateModule);

const conferenceModule = require("./modules/confrenceModule/routes/index");
v1router.use("/conferencemodule", conferenceModule);

const timetableModule = require("./modules/timetableModule/routes/index");
v1router.use("/timetablemodule", timetableModule);

const quizModuleFaculty = require("./modules/quizModule/faculty/routes/index");
v1router.use("/quizmodule/faculty", quizModuleFaculty);

const quizModuleStudent = require("./modules/quizModule/student/routes/index");
v1router.use("/quizmodule/student", quizModuleStudent);

const uploadModule = require("./modules/uploadModule/upload");
v1router.use("/upload", uploadModule);

const attendanceModule = require("./modules/attendanceModule/routes/index");
v1router.use("/attendancemodule", attendanceModule);

const reviewModule = require("./modules/reviewModule/routes/index");
v1router.use("/reviewmodule", reviewModule);

const nirfModule = require("./modules/Nirf/routes/index");
v1router.use("/nirf", nirfModule);


const usermanagementModule = require("./modules/usermanagement/routes/routes");
v1router.use("/auth", usermanagementModule);

const newusermanagementModule = require("./modules/usermanagement/routes/index");
v1router.use("/user", newusermanagementModule);

const platform = require("./modules/platform/routes")
v1router.use("/platform", platform);

// diabetics
const diabeticsModule = require("./modules/diabeticsModule/routes/index");
v1router.use("/diabeticsModule", diabeticsModule);

// face recognition
// Was mounted with zero auth middleware — any of the ~40 endpoints below
// (process control, RTSP attendance runs, config, GPU metrics) was reachable
// by anyone who could reach the server, no cookie required. Now gated the
// same as every other attendance-module route: admin / iams-admin /
// iams-dept-admin only (see attendanceRoleAccess); mlRoutes.js additionally
// locks its most sensitive endpoints (process control, gpu-metrics) down to
// admin / iams-admin.
const { attendanceRoleAccess } = require("./modules/attendanceModule/middleware/attendanceAccess");
const mlRoutes = require("./modules/attendanceModule/routes/mlRoutes");
v1router.use("/ml", ...attendanceRoleAccess, mlRoutes);

const guideModule = require("./modules/guideModule/routes/index");
v1router.use("/guide", guideModule);

module.exports = v1router;

const express = require("express");
const router = express.Router();
const { register, login, update } = require("./usercontroller");
router.route("/login").post(login);
router.route("/update").put(update);
router.post("/register", register);
const { sendOTP } = require("./usercontroller");
router.post("/otp", sendOTP);

module.exports = router;
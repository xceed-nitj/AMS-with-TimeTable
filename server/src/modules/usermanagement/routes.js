const express = require("express");
const router = express.Router();
const {
  register,
  login,
  update, // Include the resetPassword function
} = require("./usercontroller");
const { forgotPassword } = require("./forgotpasswordroute.js");
const { resetPassword } = require("./resetpasswordroute.js");

router.route("/login").post(login);
router.route("/update").put(update);
router.post("/register", register);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); // Include the new endpoint

module.exports = router;

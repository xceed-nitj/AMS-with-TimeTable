const express = require("express");
const router = express.Router();
const {
  register,
  login,
  update,
  forgotPassword,
  resetPassword, // Include the resetPassword function
} = require("./usercontroller");

router.route("/login").post(login);
router.route("/update").put(update);
router.post("/register", register);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); // Include the new endpoint

module.exports = router;

const mongoose = require("mongoose");
const mailSender = require("../../modules/usermanagement/mailsender");
require('../commonFields');

const Schema = mongoose.Schema;
const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now(),
    expires: 2 * 60,
  },
});

// pre middleware for sending email

async function sendVerificationEmail(email, otp) {
  try {
    const mailresponse = await mailSender(
      email,
      "Verification Email from NITJ",
      otp
    );
    console.log("mail send successful", mailresponse);
  } catch (e) {
    console.log("error during mail sending in otp schema ", e);
    throw e;
  }
}

otpSchema.pre("save", async function (next) {
  await sendVerificationEmail(this.email, this.otp);
  next();
});

module.exports = mongoose.model("OTP", otpSchema);
const mongoose = require("mongoose");
const mailSender = require("../../modules/usermanagement/mailsender");
require("../commonFields");

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
    expires: 5 * 60,
  },
});

// pre middleware for sending email

// Define a method for sending verification email
otpSchema.methods.sendVerificationEmail = async function () {
  try {
    const mailresponse = await mailSender(
      this.email,
      "Verification Email from NITJ",
      this.otp
    );
    console.log("Mail send successful", mailresponse);
  } catch (error) {
    console.log("Error during mail sending in otp schema ", error);
    throw error;
  }
};

otpSchema.pre("save", async function (next) {
  try {
    await this.sendVerificationEmail();
    next();
  } catch (error) {
    console.log("Error during mail sending in otp schema ", error);
    next(error);
  }
});

module.exports = mongoose.model("OTP", otpSchema);

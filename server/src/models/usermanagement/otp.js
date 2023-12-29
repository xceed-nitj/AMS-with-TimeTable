const mongoose = require("mongoose");
const mailSender = require("../../modules/usermanagement/controllers/mailsender");
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
  createdAt: {
    type: Date,
    default: Date.now,
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
otpSchema.statics.checkAndDeleteExpiredOTPs = async function () {
  const expirationTime = new Date(Date.now() - 10 * 60 * 1000);
  await this.deleteMany({ createdAt: { $lt: expirationTime } });
};

setInterval(() => {
  mongoose.model("OTP").checkAndDeleteExpiredOTPs();
}, 60 * 1000);

module.exports = mongoose.model("OTP", otpSchema);

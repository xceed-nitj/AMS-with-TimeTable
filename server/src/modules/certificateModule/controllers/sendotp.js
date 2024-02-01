const User = require("../../../models/usermanagement/user");

const OTP = require("../../../models/usermanagement/otp");
const otpGenerator = require("otp-generator");

const fs = require("fs");
const ejs = require("ejs");
const mailSender = require("../../mailsender");
const path = require("path");
const ejsTemplatePath = path.join(__dirname, "otpbody.ejs");
console.log(ejsTemplatePath);
const { adminOTP } = require("../../../models/certificateModule/admin-otp");

const verifyOTP = async (email, enteredOTP) => {
  try {
    const otpRecord = await adminOTP.findOne({ email });

    if (!otpRecord) {
      console.log("No OTP record found for the user");
      return false;
    }

    const storedOTP = otpRecord.otp;

    // Compare the entered OTP with the stored OTP
    return enteredOTP === storedOTP;
  } catch (error) {
    console.log("Error verifying OTP: ", error);
    return false;
  }
};

module.exports = { verifyOTP };

const User = require("../../../models/usermanagement/user");

const OTP = require("../../../models/usermanagement/otp");
const otpGenerator = require("otp-generator");

const fs = require("fs");
const ejs = require("ejs");
const mailSender = require("../../mailsender");
const path = require("path");
const ejsTemplatePath = path.join(__dirname, "otpbody.ejs");
console.log(ejsTemplatePath);
const adminOTP = require("../../../models/certificateModule/admin-otp");

const verifyOTP = async (email, enteredOTP) => {
  try {
    console.log(email);
    console.log(enteredOTP);
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

const sendOTP = async (email) => {
  try {
    const checkuser = await User.findOne({ email: email });
    console.log("cu");
    if (!checkuser) {
      console.log("User not exists");
      return {
        success: false,
        message: "User not exists",
      };
    }

    let result = await adminOTP.findOne({ email });
    var otp = null;
    if (result) {
      otp = result.otp;
      console.log("OTP already exists:", otp);
    } else {
      otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      await adminOTP.create({ email, otp });
      console.log("New OTP generated:", otp);
    }

    console.log(otp);
    const otpInfo = {
      title: "Email verification for NITJ",
      purpose:
        "Thank you for registering with NITJ. To complete your registration, please use the following OTP (One-Time Password) to verify your account:",
      OTP: otp,
    };

    const otpBody = fs.readFileSync(ejsTemplatePath, "utf-8");
    const renderedHTML = ejs.render(otpBody, otpInfo);

    // Add await here
    await mailSender(email, "Sign Up verification", renderedHTML);

    return {
      success: true,
      message: "OTP sent successfully",
    };
  } catch (e) {
    console.log("Error in sending OTP ", e);
    return {
      success: false,
      message: "Error in sending OTP",
    };
  }
};
module.exports = { verifyOTP, sendOTP };

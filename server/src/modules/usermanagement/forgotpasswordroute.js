const User = require("../../models/usermanagement/user");

const OTP = require("../../models/usermanagement/otp");
const otpGenerator = require("otp-generator");

const fs = require("fs");
const ejs = require("ejs");
const mailSender = require("./mailsender");
const path = require("path");
const ejsTemplatePath = path.join(__dirname, "otpBody.ejs");

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const checkuser = await User.findOne({ email: email });
    if (!checkuser) {
      console.log("User not exists");
      return res.status(200).json({
        success: false,
        message: "User not exists",
      });
    }

    // Generate and send OTP
    const otp = await sendOTP(email);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: otp, // Send the OTP to the client for verification
    });
  } catch (e) {
    console.log("Error in sending OTP ", e);
    return res.status(402).json({
      success: false,
      message: "Error in sending OTP",
    });
  }
}

const sendOTP = async (email) => {
  try {
    const checkuser = await User.findOne({ email: email });
    if (!checkuser) {
      console.log("User not exists");
      return {
        success: false,
        message: "User not exists",
      };
    }

    let result = await OTP.findOne({ email });
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
      await OTP.create({ email, otp });
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
module.exports = { forgotPassword, sendOTP };

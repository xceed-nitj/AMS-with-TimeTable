const User = require("../../../models/usermanagement/user");

const OTP = require("../../../models/usermanagement/otp");
const otpGenerator = require("otp-generator");

const fs = require("fs");
const ejs = require("ejs");
const mailSender = require("../../mailsender");
const path = require("path");
const ejsTemplatePath = path.join(__dirname, "otpbody.ejs");
console.log(ejsTemplatePath);
async function forgotPassword(req, res) {
  try {
    const email = String(req.body.email || "").trim();
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

    // OTP records are keyed by lowercased email so the reset step matches
    // regardless of how the user re-types their address. Always issue a fresh
    // OTP: reusing an existing record risks sending one that the 10-minute
    // cleanup sweeper is about to delete.
    const otpKey = email.trim().toLowerCase();
    await OTP.deleteMany({ email: otpKey });
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    await OTP.create({ email: otpKey, otp });

    const otpInfo = {
      title: "Forgot Password",
      purpose:
        "We received a request to reset the password for your XCEED account. Use the following OTP (One-Time Password) to set your new password:",
      OTP: otp,
    };

    const otpBody = fs.readFileSync(ejsTemplatePath, "utf-8");
    const renderedHTML = ejs.render(otpBody, otpInfo);

    // Add await here
    await mailSender(email, "Forgot Password — OTP", renderedHTML);

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

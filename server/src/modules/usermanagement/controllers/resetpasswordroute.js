const User = require("../../../models/usermanagement/user");
const bcrypt = require("bcryptjs");
const OTP = require("../../../models/usermanagement/otp");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

async function resetPassword(req, res) {
  try {
    const { otp, password } = req.body;
    const email = String(req.body.email || "").trim();
    // OTPs are stored keyed by lowercased email (see forgotpasswordroute.js)
    const otpKey = email.toLowerCase();

    // Verify the OTP
    const isOTPValid = await verifyOTP(otpKey, otp);

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Update the password and delete the used OTP. Email lookup is
    // case-insensitive so a re-typed address still matches the account.
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailPattern = new RegExp(
      `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
    const [user] = await Promise.all([
      User.findOneAndUpdate(
        { email: emailPattern },
        { $set: { password: hashedPassword } },
        { new: true }
      ),
      OTP.deleteOne({ email: otpKey }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
      user,
    });
  } catch (e) {
    console.log("Error in resetting password ", e);
    return res.status(500).json({
      success: false,
      message: "Error in resetting password",
    });
  }
}

const verifyOTP = async (email, enteredOTP) => {
  try {
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      console.log("No OTP record found for the user");
      return false;
    }

    // Compare as trimmed strings — tolerates copy-paste whitespace and
    // number/string type differences from the client.
    return String(enteredOTP).trim() === String(otpRecord.otp).trim();
  } catch (error) {
    console.log("Error verifying OTP: ", error);
    return false;
  }
};

module.exports = { resetPassword, verifyOTP };

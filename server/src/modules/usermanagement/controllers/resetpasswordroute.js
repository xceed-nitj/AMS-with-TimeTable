const User = require("../../../models/usermanagement/user");
const bcrypt = require("bcryptjs");
const OTP = require("../../../models/usermanagement/otp");
const dotenv = require("dotenv");

dotenv.config();

async function resetPassword(req, res) {
  try {
    const { email, otp, password } = req.body;

    // Verify the OTP
    const isOTPValid = await verifyOTP(email, otp);

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Update the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: hashedPassword } },
      { new: true }
    );

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

    const storedOTP = otpRecord.otp;

    // Compare the entered OTP with the stored OTP
    return enteredOTP === storedOTP;
  } catch (error) {
    console.log("Error verifying OTP: ", error);
    return false;
  }
};

module.exports = { resetPassword, verifyOTP };

const User = require("../../../models/usermanagement/user");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret =
  "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";

const OTP = require("../../../models/usermanagement/otp");
const otpGenerator = require("otp-generator");
const dotenv = require("dotenv"); // Corrected import
const fs = require("fs");
const ejs = require("ejs");
const mailSender = require("./mailsender");
const path = require("path");
const ejsTemplatePath = path.join(__dirname, "otpBody.ejs");
dotenv.config();

exports.register = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req);

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password less than 6 characters" });
  }
  try {
    // Hash the password using bcrypt
    bcrypt.hash(password, 10, async (hashErr, hash) => {
      if (hashErr) {
        return res
          .status(500)
          .json({ message: "Password hashing failed", error: hashErr.message });
      }

      // Create the user with the hashed password
      try {
        const user = await User.create({
          email,
          password: hash,
        });

        // Generate a JWT token
        const maxAge = 3 * 60 * 60 * 60; // 3 hours in seconds
        const token = jwt.sign(
          { id: user._id, email, role: user.role },
          jwtSecret,
          {
            expiresIn: maxAge,
          }
        );

        // Set the JWT token as a cookie
        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: maxAge * 1000,
        });

        res.status(201).json({
          message: "User successfully created",
          user,
        });
      } catch (createErr) {
        res.status(400).json({
          message: "User not successful created",
          error: createErr.message,
        });
      }
    });
  } catch (err) {
    res.status(401).json({
      message: "User not successful created",
      error: err.message,
    });
  }
};

// login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if username and password are provided
  if (!email || !password) {
    return res.status(400).json({
      message: "Username or Password not present",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Login not successful",
        error: "User not found",
      });
    }

    // Compare given password with hashed password
    bcrypt.compare(password, user.password, (compareErr, result) => {
      if (compareErr) {
        return res.status(500).json({
          message: "Password comparison failed",
          error: compareErr.message,
        });
      }

      if (result) {
        const maxAge = 3 * 60 * 60; // 3 hours in seconds
        const token = jwt.sign(
          { id: user._id, email, role: user.role },
          jwtSecret,
          {
            expiresIn: maxAge,
          }
        );

        // Set the JWT token as a cookie
        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: maxAge * 10000,
          // domain: "nitjtt.netlify.app",
          secure: true,
          sameSite: "none",
        });

        res.status(200).json({
          message: "User successfully logged in",
          user,
        });
      } else {
        res.status(400).json({ message: "Login not successful" });
      }
    });
  } catch (error) {
    res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};

exports.update = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Verify if the email is present
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // If user is not found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    if (password) {
      // Update password if provided
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    if (role) {
      // Update role if provided
      // Verify if the role is valid
      user.role = role;
    }

    // Save the updated user
    await user.save();

    return res.status(201).json({ message: "Update successful", user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

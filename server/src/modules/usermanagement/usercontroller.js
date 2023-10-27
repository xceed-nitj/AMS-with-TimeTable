
const User = require("../../models/usermanagement/user");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret =
  "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";

const OTP = require("../../models/usermanagement/otp");
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
          // httpOnly: true,
          maxAge: maxAge * 1000,
          domain: "nitjtt.netlify.app",
          path:"/"
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
  const { role, id } = req.body;

  // First - Verify if role and id are present
  if (role && id) {
    // Second - Verify if the value of role is admin
    if (role === "admin") {
      try {
        // Find the user with the id
        const user = await User.findById(id);

        // Third - Verify the user is not already an admin
        if (user.role !== "admin") {
          user.role = role;
          await user.save();
          res.status(201).json({ message: "Update successful", user });
        } else {
          res.status(400).json({ message: "User is already an Admin" });
        }
      } catch (error) {
        res
          .status(400)
          .json({ message: "An error occurred", error: error.message });
      }
    } else {
      res.status(400).json({ message: "Invalid role value" });
    }
  } else {
    res.status(400).json({ message: "Role and id are required" });
  }
};

exports.sendOTP = async (req, res) => {
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

    let result = await OTP.findOne({ email });
    var otp = null;
    if (result) {
      otp = result.opt;
      console.log("here");
    } else {
      otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      await OTP.create({ email, otp });
    }
    console.log(otp);
    const otpInfo = {
      title: "Email verification to Sign up for NITJ",
      purpose:
        "Thank you for registering with NITJ. To complete your registration, please use the following OTP (One-Time Password) to verify your account:",
      OTP: otp, // Corrected template variable
    };

    // Assuming ejsTemplatePath is defined
    const otpBody = fs.readFileSync(ejsTemplatePath, "utf-8");
    const renderedHTML = ejs.render(otpBody, otpInfo);

    // Assuming mailSender is defined
    mailSender(email, "Sign Up verification", renderedHTML);

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
};
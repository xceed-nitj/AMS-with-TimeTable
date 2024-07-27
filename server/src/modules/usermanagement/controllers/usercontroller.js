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
// const mailSender = require("./mailsender");
const path = require("path");
const ejsTemplatePath = path.join(__dirname, "otpbody.ejs");
const mailSender = require("../../mailsender");
// const ejsTemplatePath = path.join(__dirname, "otpBody.ejs");
dotenv.config();

exports.register = async (req, res, next) => {
  const { email, password,roles } = req.body;
  console.log(req);

  const existingUser = await User.findOne({email:email})
  if(existingUser!==null){
    if(existingUser.email.includes(email)){
      return res.status(400).json({message: "User already exists, use forgot password to reset your password"})
    }
  }

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
          name: email,
          email: email,
          password: hash,
          role:roles,
          isEmailVerified:false,
          isFirstLogin: false,
        });

        // Generate a JWT token
        const maxAge = 3 * 60 * 60 * 60; // 3 hours in seconds
        const token = jwt.sign(
          { id: user._id, name: email, email: email, role: user.role },
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

        const otp = await sendOTP(email);
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

//verifying otp entered
exports.verification = async(req,res)=>{
  try {
    const {email,otp} = req.body;
    const validOTP = await OTP.findOne({ email, otp });
    console.log(validOTP);
    if (!validOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await OTP.deleteOne({ email, otp }); 
    const update = {
      $set: { isEmailVerified: true }
    };
    const user = await User.findOneAndUpdate(
      {email: email}, 
      update, 
      { returnOriginal: false }
    )
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (e) {
    console.log("Error in verifying OTP ", e);
    res.status(500).json({
      success: false,
      message: "Error in verifying OTP",
    });
  }
}

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
    const updatebody = req.body;
    const { email, password } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);
    updatebody.password = hashedPassword;


    const newUser = await User.findOneAndUpdate(
      {email: email},
      updatebody,
      { returnOriginal: false },
    )

    // Save the updated user
    await newUser.save();

    return res.status(201).json({ message: "Update successful", user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const sendOTP = async (email) => {
  try {

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

exports.otp = async (req,res) => {
  const email = req.body.email;
  const otp = await sendOTP(email);
  res.status(201).json({
    message: "OTP sent successfully",
  });
}

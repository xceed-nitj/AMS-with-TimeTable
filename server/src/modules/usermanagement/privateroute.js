const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const getUserDetails = require("./controllers/dto");
const jwtSecret =
  "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab"; // Replace with your actual secret

// this route is for checking department timetable coordinators
async function protectRoute(req, res, next) {
  const token = req.cookies.jwt;
  // console.log(token)

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);

    // The token is valid, and 'decoded' contains user information
    const userId = decoded.id;

    // Use await to handle the asynchronous nature of getUserDetails
    const user = await getUserDetails(userId);

    if (!user.role || !user.role.includes("DTTI")) {
      return res
        .status(401)
        .json({ message: "Only DDTC or ITTC are authorized to access" });
    }
    // Attach the user details to the 'req' object
    req.user = {
      id: userId,
      email: user.email,
    };

    // Allow the request to proceed
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = protectRoute;

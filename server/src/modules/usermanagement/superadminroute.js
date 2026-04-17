const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const getUserDetails = require("./controllers/dto");
const jwtSecret = process.env.JWT_SECRET;

// Middleware to protect the route and verify the token
async function superadminRoute(req, res, next) {
  const token = req.cookies.jwt || req.headers.authorization?.replace('Bearer ', '');
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
    console.log(user);

    if (!user.role || !user.role.includes("admin")) {
      return res
        .status(401)
        .json({ message: "Only admins are authorized to access" });
    }

    // Attach the user details to the 'req' object
    req.user = {
      id: userId,
      email:user.email,
    };

    // Allow the request to proceed
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = superadminRoute;

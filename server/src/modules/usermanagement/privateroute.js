const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const getUserDetails = require('./dto');
const jwtSecret =   "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab"; // Replace with your actual secret

// Middleware to protect the route and verify the token
function protectRoute(req, res, next) {
  const token = req.cookies.jwt; // Assuming the token is stored in a cookie named 'token'

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);

    // The token is valid, and 'decoded' contains user information
    const userId = decoded.id;
    
   // Attach the user details to the 'req' object
   req.user = {
    id: userId,
    // other user details...
  };

  // Allow the request to proceed
  next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = protectRoute;

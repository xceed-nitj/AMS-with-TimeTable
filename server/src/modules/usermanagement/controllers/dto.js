const express = require("express");
const router = express.Router();

const User = require("../../../models/usermanagement/user");

const mongoose = require("mongoose");

// Function to get user details based on the user ID
async function getUserDetails(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return null; // User not found
    }

    // You can select the fields you want to retrieve
    const userDetails = {
      email: user.email,
      role: user.role,
      id: user.id,
      // Add more fields as needed
    };

    return userDetails;
  } catch (error) {
    throw error;
  }
}

module.exports = getUserDetails;

const express = require("express");
const router = express.Router();

const User = require("../../../models/usermanagement/user");
const {
  getFacultyDepartmentByEmail,
} = require("./facultyDepartment");

// Function to get user details based on the user ID
async function getUserDetails(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return null; // User not found
    }

    const department = user.dept?.trim()
      || await getFacultyDepartmentByEmail(user.email);
    const userDetails = {
      email: user.email,
      role: user.role,
      id: user.id,
      department,
    };

    return userDetails;
  } catch (error) {
    throw error;
  }
}

module.exports = getUserDetails;

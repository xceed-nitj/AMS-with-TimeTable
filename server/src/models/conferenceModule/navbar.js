const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const navbarSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  heading: {
    type: String,
    required: true,
  },
  subHeading: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

// Create the Mongoose model
const Navbar = mongoose.model("cf-navbar", navbarSchema);

module.exports = Navbar;

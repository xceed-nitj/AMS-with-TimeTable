const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const userSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  accessType: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});

// Create the Mongoose model
const User = mongoose.model("cf-user", userSchema);

module.exports = User;

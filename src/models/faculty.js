const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  }, 
  extension: {
    type: String,
    required: true,
  },
});

// Create the Mongoose model
const Faculty = mongoose.model("Faculty", facultySchema);

module.exports = Faculty;

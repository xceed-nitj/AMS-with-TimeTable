const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const facultySchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Designation: {
    type: String,
    required: true,
  },
  Dept: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
  }, 
  Extension: {
    type: String,
    required: true,
  },
});

// Create the Mongoose model
const Faculty = mongoose.model("Faculty", facultySchema);

module.exports = Faculty;

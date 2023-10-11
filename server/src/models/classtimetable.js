const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const classTableSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
  },
  slot: {
    type: String,
    required: true,
  },
  sub: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
  }, 
  code: {
    type: String,
    required: true,
  },
});

// Create the Mongoose model
const ClassTable = mongoose.model("ClassTable", classTableSchema);

module.exports = ClassTable;
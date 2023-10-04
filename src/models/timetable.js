const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const tableSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Dept: {
    type: String,
    required: true,
  },
  Session: {
    type: String,
    required: true,
  },
  Code:{
    type:String,
    required:true,
  },
});

// Create the Mongoose model
const Table = mongoose.model("Table", tableSchema);

module.exports = Table;

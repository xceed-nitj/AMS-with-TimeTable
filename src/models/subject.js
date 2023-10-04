const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const subjectSchema = new mongoose.Schema({
  SubName:{
    type:String,
    required:true,
  },
  SubCode: {
    type: String,
    required: true,
  },
  SubType: {
    type: String,
    required: true,
  },
  Sem: {
    type: Number,
    required: true,
  },
  Dept: {
    type: String,
    required: true,
  },
  Type: {
    type: Enumerator, // Example: "class", "lab", "tut"
    required: true,
  },
  Credits: {
    type: Number,
    required: true,
  },
});

// Create the Mongoose model
const Subject= mongoose.model("Subject", subjectSchema);

module.exports = Subject;

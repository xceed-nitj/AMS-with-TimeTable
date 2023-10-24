const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const subjectSchema = new mongoose.Schema({
  abbreviation:{
    type:String,
    required:true,
  },
  type: {
    type: String,
    // enum:["theory","tutorial","Project","others"], // Example: "class", "lab", "tut"
    required: true,
  },
  subCode: {
    type: String,
    required: true,
  },
  subName:{
    type:String,
    required:true,
  },
  sem: {
    type: String,
    required: true,
  },
  degree:{
    type:String,
    required:true,
  },
  dept: {
    type: String,
    required: false,
  },
  credits: {
    type: Number,
    required: false,
  },
  code:{
    type: String,
    required: false,
  }
});

// Create the Mongoose model
const Subject= mongoose.model("Subject", subjectSchema);

module.exports = Subject;

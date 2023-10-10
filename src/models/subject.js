const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const subjectSchema = new mongoose.Schema({
  subName:{
    type:String,
    required:true,
  },
  subCode: {
    type: String,
    required: true,
  },
  subType: {
    type: String,
    enum:["PE","PC","OE","FE","others"],
    required: true,
  },
  sem: {
    type: Number,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum:["theory","tutorial","Project","others"], // Example: "class", "lab", "tut"
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
});

// Create the Mongoose model
const Subject= mongoose.model("Subject", subjectSchema);

module.exports = Subject;

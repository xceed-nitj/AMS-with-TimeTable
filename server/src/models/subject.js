const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


// Define your Mongoose schema based on the interface
const subjectSchema = new mongoose.Schema({
  subjectFullName:{
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
  studentCount:{
    type:Number,
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
  },
  // ── Attendance / Embedding fields ──────────────────────────────────────────
  enrolledRollNos: {
    type: [String],
    default: [],
  },
  missedGroundTruth: {        // roll nos in the xlsx that have no GT folder
    type: [String],
    default: [],
  },
  embeddingFile: {            // e.g. "6_Digital_Electronics.pkl"
    type: String,
    default: null,
  },
  embeddingUpdatedAt: {
    type: Date,
    default: null,
  },
  
});



// subjectSchema.add(commonFields);

// // Apply the pre-save middleware
// subjectSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Subject= mongoose.model("Subject", subjectSchema);

module.exports = Subject;

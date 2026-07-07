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
  // ── ERP roster sync (ERP Embedding Generation tab) ─────────────────────────
  erpSyncedAt: {              // when enrolledRollNos was last fetched from the ERP
    type: Date,
    default: null,
  },
  erpFaculty: {               // faculty name as reported by the ERP for this subject
    type: String,
    default: null,
  },
  timetableFaculty: {         // faculty found in the timetable module (LockSem) for sem+abbreviation
    type: String,
    default: null,
  },
  facultyMatch: {             // erpFaculty vs timetableFaculty (case/space-insensitive)
    type: Boolean,
    default: null,
  },
});



// subjectSchema.add(commonFields);

// // Apply the pre-save middleware
// subjectSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Subject= mongoose.model("Subject", subjectSchema);

module.exports = Subject;

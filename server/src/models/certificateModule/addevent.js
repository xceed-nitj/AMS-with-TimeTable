const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('../commonFields');
const { type } = require("os");
const participantTypes = ["internal", "external"];
const organiserTypes = ["department", "club", "center"];

// Define your Mongoose schema based on the interface
const addEventSchema = new mongoose.Schema({
  name: {
    type: String,
    required:true,
  },
  user: {
    type: String,
    
  },
  ExpiryDate: {
    type: Date,
    
  }, 
  participantType:{
    type: String,
    
  },
  organiserType: {
    type: String,
  },
  eventType:{
    type: String,
  },
  totalCertificates:{
    type:Number,
    default:0,
  },
  certificatesIssued:{
    type:Number,
    default:0,
  },
  lock:{
    type: Boolean,
    default:false,
  },
  plan: {
    type: String,
    enum: ["basic", "premium"],
    default: "basic",
  },
});

addEventSchema.add(commonFields);

// Apply the pre-save middleware
addEventSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const addEvent = mongoose.model("addEvent", addEventSchema);

module.exports = addEvent;

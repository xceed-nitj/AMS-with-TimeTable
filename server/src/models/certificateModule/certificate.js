const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('../commonFields');

// Define your Mongoose schema based on the interface
const CertificateSchema = new mongoose.Schema({
  logos: {
    type: Array,
    
  },
  header: {
    type: Array,
    
  },
  body: {
    type: String,
    
  }, 
  footer: {
    type: Array,
    
  },
  signatures: {
    type: Array,
    
  },
  certiType: {
    type: String,
    
  },
  
  eventId: {
    type: String,
  },
});

CertificateSchema.add(commonFields);

// Apply the pre-save middleware
CertificateSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Certificate = mongoose.model("Certificate", CertificateSchema);

module.exports = Certificate;
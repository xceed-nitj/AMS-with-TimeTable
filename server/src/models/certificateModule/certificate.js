const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('../commonFields');

// Define your Mongoose schema based on the interface
const CertificateSchema = new mongoose.Schema({
  logos: {
    type: Array,
    
  },
  Header: {
    type: Array,
    
  },
  Body: {
    type: String,
    
  }, 
  Footer: {
    type: Array,
    
  },
  Signatures: {
    type: Array,
    
  },
});

CertificateSchema.add(commonFields);

// Apply the pre-save middleware
CertificateSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Certificate = mongoose.model("Certificate", CertificateSchema);

module.exports = Certificate;
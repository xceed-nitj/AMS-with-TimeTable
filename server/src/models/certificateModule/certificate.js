const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');

// Define your Mongoose schema based on the interface
const CertificateSchema = new mongoose.Schema({
  logos: {
    type: Array,
    required: true,
  },
  Header: {
    type: Array,
    required: true,
  },
  Body: {
    type: String,
    required: true,
  }, 
  Footer: {
    type: Array,
    required: true,
  },
  Signatures: {
    type: Array,
    required: true,
  },
});

CertificateSchema.add(commonFields);

// Apply the pre-save middleware
CertificateSchema.pre('save', updateTimestamps);

// Create the Mongoose model
const Certificate = mongoose.model("Certificate", CertificateSchema);

module.exports = Certificate;

const mongoose = require('mongoose');

// Define patient schema
const patientSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        default: '12345',  // Set default password
    },
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    medicalHistory: {
        type: String,
    },
    // Add other fields as necessary
});

// Create and export the patient model
const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;

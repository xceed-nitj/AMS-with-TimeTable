const mongoose = require('mongoose');

// Define patient schema
const doctorSchema = new mongoose.Schema({
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
    hospital: {
        type: String,
        required: true,
    }
    // Add other fields as necessary
});

// Create and export the patient model
const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
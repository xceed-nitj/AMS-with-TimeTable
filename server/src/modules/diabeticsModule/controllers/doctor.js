const Doctor = require('../../../models/diabeticsModule/doctor'); // Adjusted path
const Hospital = require('../../diabeticsModule/controllers/hospital');
const { addDoctorToHospital } = require('../controllers/hospital');
const User = require("../../../models/usermanagement/user"); // Import the User model

// Controller function to add a new doctor
const addDoctor = async (req, res) => {
    const { email, name, age, contactNumber, address, hospital } = req.body;

    try {
        // Check if the doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ message: 'Doctor already exists' });
        }

        // Create a new doctor
        const newDoctor = new Doctor({
            email,
            name,
            age,
            contactNumber,
            address,
            hospital,
        });

        // Save the doctor to the database
        await newDoctor.save();
        // Add the doctor to the user database with role "doctor" and default password
        const user = new User({
            name,
            role: ["doctor"], // Set the role to doctor
            password: "12345", // Default password
            email: [email], // Store email as an array
            area: hospital,
            isEmailVerified: false, // Set default value for email verification
            isFirstLogin: true // Set default value for first login
        });

        // Save the user to the user database
        await user.save();

        try {
            await addDoctorToHospital(hospital, newDoctor._id, newDoctor.name);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(201).json({ message: 'Doctor added successfully', doctor: newDoctor });
    } catch (error) {
        console.error('Error adding doctor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// get all doctors
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: "Error fetching doctors.", error });
    }
};

// get doctor by id
const getDoctorById = async (req, res) => {
    const { id } = req.params;
    try {
        const doctor = await Doctor.findById(id);
        if (!doctor) return res.status(404).json({ message: "Doctor not found." });
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving doctor.", error });
    }
};

// update doctor
const updateDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        const doctor = await Doctor.findByIdAndUpdate(id, req.body, { new: true });
        if (!doctor) return res.status(404).json({ message: "Doctor not found." });
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: "Error updating doctor.", error });
    }
};

// delete a doctor
const deleteDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        const doctor = await Doctor.findByIdAndDelete(id);
        if (!doctor) return res.status(404).json({ message: "Doctor not found." });
        res.status(200).json({ message: "Doctor deleted." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting doctor.", error });
    }
};

// Export the controller functions
module.exports = {
    addDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor
};
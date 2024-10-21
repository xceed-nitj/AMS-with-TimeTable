const Patient = require('../../../models/diabeticsModule/patient'); // Adjusted path
const { addPatientToHospital } = require('../controllers/hospital');
const User = require('../../../models/usermanagement/user'); // Import the User model

// Controller function to add a new patient
const addPatient = async (req, res) => {
    const { email, name, DOB, gender, father_name, mother_name, weight, height, DOD_of_T1D, family_history, economic_status, family_tree, immunization_history, treatment_history, referring_physician, age, contactNumber, address, medicalHistory, hospital, doctorIds } = req.body;

    try {
        // Check if the patient already exists
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({ message: 'Patient already exists' });
        }
        // Find all doctors in the same hospital
        const doctors = await User.find({
            role: 'doctor',
            area: { $in: [hospital] }
        });
        // Extract the ObjectIds of the doctors
        const doctorIds = doctors.map(doctor => doctor._id);
        // Create a new patient
        const newPatient = new Patient({
            email,
            name,
            DOB,
            gender,
            father_name,
            mother_name,
            weight,
            height,
            DOD_of_T1D,
            family_history,
            economic_status,
            family_tree,
            immunization_history,
            treatment_history,
            referring_physician,
            age,
            contactNumber,
            address,
            medicalHistory,
            hospital,
            doctorIds,
        });

        // Save the patient to the database
        await newPatient.save();
        // Add the patient to the user database with role "patient" and default password
        const user = new User({
            name,
            role: ["patient"], // Set the role to patient
            password: "12345", // Default password
            email: [email], // Store email as an array
            isEmailVerified: false, // Set default value for email verification
            isFirstLogin: true // Set default value for first login
        });

        // Save the user to the user database
        await user.save();

        try {
            await addPatientToHospital(hospital, newPatient._id, newPatient.name);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(201).json({ message: 'Patient added successfully', patient: newPatient });
    } catch (error) {
        console.error('Error adding patient:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// get all patients
const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find();
        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ message: "Error fetching patients.", error });
    }
};

// get patient by id
const getPatientById = async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ message: "Patient not found." });
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving patient.", error });
    }
};

// update patient
const updatePatient = async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await Patient.findByIdAndUpdate(id, req.body, { new: true });
        if (!patient) return res.status(404).json({ message: "Patient not found." });
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: "Error updating patient.", error });
    }
};

// delete a patient
const deletePatient = async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await Patient.findByIdAndDelete(id);
        if (!patient) return res.status(404).json({ message: "Patient not found." });
        res.status(200).json({ message: "Patient deleted." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting patient.", error });
    }
};

// Export the controller functions
module.exports = {
    addPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
};
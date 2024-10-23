const Hospital = require("../../../models/diabeticsModule/hospital")

// Create a hospital
const addHospital = async (req, res) => {
    try {
        const newHospital = new Hospital(req.body);
        await newHospital.save();
        res.status(201).json(newHospital);
    } catch (error) {
        res.status(500).json({ message: "Error creating hospital.", error });
    }
};

const addPatientToHospital = async (hospitalName, patientId, patientName) => {
    try {
        const hospital = await Hospital.findOne({ name: hospitalName });

        if (!hospital) {
            throw new Error('Hospital not found');
        }

        // Add patient object to the hospital's patients array
        hospital.patients.push({ patientId, name: patientName });
        await hospital.save();
    } catch (error) {
        console.error('Error updating hospital with patient:', error);
        throw error; // re-throw to handle in calling function
    }
};

const addDoctorToHospital = async (hospitalName, dcotorId, doctorName) => {
    try {
        const hospital = await Hospital.findOne({ name: hospitalName });

        if (!hospital) {
            throw new Error('Hospital not found');
        }

        // Add patient object to the hospital's patients array
        hospital.doctors.push({ dcotorId, name: doctorName });
        await hospital.save();
    } catch (error) {
        console.error('Error updating hospital with doctor:', error);
        throw error; // re-throw to handle in calling function
    }
};


// Get all
const getHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ message: "Error fetching hospitals.", error });
    }
};

// Get a hospital by ID
const getHospitalById = async (req, res) => {
    const { id } = req.params;
    try {
        const hospital = await Hospital.findById(id);
        if (!hospital) return res.status(404).json({ message: "Hospital not found." });
        res.status(200).json(hospital);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving hospital.", error });
    }
};

// Update hospital by id
const updateHospital = async (req, res) => {
    const { id } = req.params;
    const fields = req.body;
    try {
        const updated = await Hospital.findByIdAndUpdate(id, fields, { new: true });
        if (!updated) return res.status(404).json({ message: "Hospital not found." });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: "Error updating hospital.", error });
    }
};

// Delete a hospital
const deleteHospital = async (req, res) => {
    const { id } = req.params;
    try {
        const hospital = await Hospital.findOneAndDelete(id);
        if (!hospital) return res.status(404).json({ message: "Hospital not found." });
        res.status(200).json({ message: "Hospital deleted." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting hospital", error });
    }
};

module.exports = { addHospital, getHospitals, getHospitalById, updateHospital, deleteHospital, addPatientToHospital, addDoctorToHospital };
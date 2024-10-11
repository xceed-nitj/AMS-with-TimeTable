const Patient = require('../../../models/diabeticsModule/patient'); // Adjusted path

// Controller function to add a new patient
const addPatient = async (req, res) => {
    const { email, name, age, contactNumber, address, medicalHistory } = req.body;

    try {
        // Check if the patient already exists
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({ message: 'Patient already exists' });
        }

        // Create a new patient
        const newPatient = new Patient({
            email,
            name,
            age,
            contactNumber,
            address,
            medicalHistory,
        });

        // Save the patient to the database
        await newPatient.save();

        return res.status(201).json({ message: 'Patient added successfully', patient: newPatient });
    } catch (error) {
        console.error('Error adding patient:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Export the controller functions
module.exports = {
    addPatient,
};
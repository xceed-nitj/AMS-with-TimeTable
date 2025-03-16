const Patient = require('../../../models/diabeticsModule/patient') // Adjusted path
const { addPatientToHospital } = require('../controllers/hospital')
const User = require('../../../models/usermanagement/user') // Import the User model
const bcrypt = require('bcryptjs')

// Controller function to add a new patient
const addPatient = async (req, res) => {
  const {
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
  } = req.body

  try {
    // Check if the patient already exists
    const existingPatient = await Patient.findOne({ email })
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient already exists' })
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: [email] })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email already exists' })
    }

    // First create a user with role "patient"
    const defaultPassword = '12345' // Default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const newUser = new User({
      name,
      role: ['patient'], // Set the role to patient
      password: hashedPassword, // Hashed default password
      email: [email], // Store email as an array
      isEmailVerified: false, // Set default value for email verification
      isFirstLogin: true, // Set default value for first login
    })

    // Save the user to the database
    await newUser.save()

    // Find all doctors in the same hospital
    const doctors = await User.find({
      role: ['doctor'],
      area: { $in: [hospital] },
    })

    // Extract the ObjectIds of the doctors if not provided
    const finalDoctorIds = doctorIds || doctors.map((doctor) => doctor._id)

    // Create a new patient with reference to the user
    const newPatient = new Patient({
      email,
      name,
      userId: newUser._id, // Store reference to the user
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
      doctorIds: finalDoctorIds,
    })

    // Save the patient to the database
    await newPatient.save()

    // Add the patient to the hospital
    try {
      await addPatientToHospital(hospital, newPatient._id, newPatient.name)
    } catch (error) {
      // If adding to hospital fails, continue with the patient creation
      console.error('Error adding patient to hospital:', error)
    }

    return res.status(201).json({
      message: 'Patient added successfully',
      patient: newPatient,
      user: { _id: newUser._id, email: newUser.email, role: newUser.role },
    })
  } catch (error) {
    console.error('Error adding patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// get all patients
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
    res.status(200).json(patients)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients.', error })
  }
}

// get patient by id
const getPatientById = async (req, res) => {
  const { id } = req.params
  try {
    const patient = await Patient.findById(id)
    if (!patient) return res.status(404).json({ message: 'Patient not found.' })
    res.status(200).json(patient)
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving patient.', error })
  }
}

// update patient
const updatePatient = async (req, res) => {
  const { id } = req.params
  const { email, name, ...otherFields } = req.body

  try {
    // Find the patient
    const patient = await Patient.findById(id)
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' })
    }

    // First update the associated user if email or name have changed
    if (email || name) {
      const user = await User.findById(patient.userId)

      if (!user) {
        return res.status(404).json({
          message:
            'Associated user not found. Patient record may be corrupted.',
        })
      }

      // Update user details
      if (name) user.name = name
      if (email) user.email = [email]

      await user.save()
    }

    // Then update the patient record
    const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, {
      new: true,
    })

    res.status(200).json({
      message: 'Patient updated successfully',
      patient: updatedPatient,
    })
  } catch (error) {
    res.status(500).json({ message: 'Error updating patient.', error })
  }
}

// delete a patient
const deletePatient = async (req, res) => {
  const { id } = req.params
  try {
    // Find the patient to get the userId
    const patient = await Patient.findById(id)

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' })
    }

    // Delete the user associated with this patient
    if (patient.userId) {
      await User.findByIdAndDelete(patient.userId)
    }

    // Delete the patient record
    await Patient.findByIdAndDelete(id)

    res
      .status(200)
      .json({ message: 'Patient and associated user deleted successfully.' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient.', error })
  }
}
const loginPatient = async (req, res) => {
  const { email, password } = req.body

  try {
    // Check if the patient exists
    const patient = await Patient.findOne({ email })
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' })
    }

    // Check if the password is correct
    if (password !== '12345') {
      // Assuming temporary password is "12345"
      return res.status(401).json({ message: 'Invalid password.' })
    }

    // Successful login
    return res.status(200).json({ message: 'Login successful.', patient })
  } catch (error) {
    console.error('Error logging in patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Get count of all patients
const getPatientCount = async (req, res) => {
  try {
    const count = await Patient.countDocuments()
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Export the controller functions
module.exports = {
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  loginPatient,
  getPatientCount,
}

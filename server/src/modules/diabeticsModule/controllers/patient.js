const Patient = require('../../../models/diabeticsModule/patient') // Adjusted path
const { addPatientToHospital } = require('../controllers/hospital')
const User = require('../../../models/usermanagement/user') // Import the User model
const bcrypt = require('bcryptjs')
const Doctor = require('../../../models/diabeticsModule/doctor') // Import the Doctor model
const DailyDosage = require('../../../models/diabeticsModule/dailyDosage')
const Hospital = require('../../../models/diabeticsModule/hospital')

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
    const existingPatient = await Patient.findOne({ email })
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient already exists' })
    }

    const existingUser = await User.findOne({ email: [email] })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email already exists' })
    }

    const defaultPassword = '12345'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const newUser = new User({
      name,
      role: ['patient'],
      password: hashedPassword,
      email: [email],
      isEmailVerified: false,
      isFirstLogin: true,
    })

    // Save the user to the database
    await newUser.save()

    const newPatient = new Patient({
      email,
      name,
      userId: newUser._id,
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
    })

    // Save the patient to the database
    await newPatient.save()

    // Add patient to the doctors who in the doctorIds array
    for (const doctorId of doctorIds) {
      const doctor = await Doctor.findById(doctorId)
      if (doctor) {
        doctor.patientIds.push(newPatient._id)
        await doctor.save()
      }
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
    const patients = await Patient.find().lean()
    const hospitals = await Hospital.find().lean()
    const patientsWithHospitals = patients.map((patient) => {
      const hospital = hospitals.find((h) => h._id.equals(patient.hospital))
      return { ...patient, hospital: hospital || null }
    })
    res.status(200).json(patientsWithHospitals)
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

    const hospital = await Hospital.findById(patient.hospital)
    const doctors = await Doctor.find({ patientIds: { $in: [id] } })
    // Combine patient and user data
    const patientData = {
      ...patient.toObject(),
      hospital,
      doctors,
    }

    res.status(200).json(patientData)
  } catch (error) {
    console.error('Error retrieving patient:', error)
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

    // Delete all the records created by the patient
    await DailyDosage.deleteMany({ patientId: id })

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

// Get patient's own data
const getPatientOwnData = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id })
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' })
    }

    // Get the associated user data
    const user = await User.findById(patient.userId)
    if (!user) {
      return res.status(404).json({ message: 'Associated user not found.' })
    }

    // Combine patient and user data
    const patientData = {
      ...patient.toObject(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isFirstLogin: user.isFirstLogin,
      },
    }

    res.status(200).json(patientData)
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving patient data.', error })
  }
}

// Get unassigned patients for a doctor
const getUnassignedPatients = async (req, res) => {
  try {
    const { doctorId } = req.params

    // Find the doctor
    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    // Get all patients that are not assigned to this doctor
    const unassignedPatients = await Patient.find({
      _id: { $nin: doctor.patientIds },
      hospital: doctor.hospital, // Only show patients from the same hospital
    })

    res.status(200).json(unassignedPatients)
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching unassigned patients', error })
  }
}

module.exports = {
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  loginPatient,
  getPatientCount,
  getPatientOwnData,
  getUnassignedPatients,
}

const Doctor = require('../../../models/diabeticsModule/doctor') // Adjusted path
const Hospital = require('../../diabeticsModule/controllers/hospital')
const { addDoctorToHospital } = require('../controllers/hospital')
const User = require('../../../models/usermanagement/user') // Import the User model
const Patient = require('../../../models/diabeticsModule/patient') // Import the Patient model
const bcrypt = require('bcryptjs')

// Controller function to add a new doctor
const addDoctor = async (req, res) => {
  const { email, name, age, contactNumber, address, hospital } = req.body

  try {
    // Check if the doctor already exists
    const existingDoctor = await Doctor.findOne({ email })
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor already exists' })
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: [email] })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email already exists' })
    }

    // First create a user with role "doctor"
    const defaultPassword = '12345' // Default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const newUser = new User({
      name,
      role: ['doctor'], // Set the role to doctor
      password: hashedPassword, // Hashed default password
      email: [email], // Store email as an array
      area: hospital ? [hospital] : [],
      isEmailVerified: false, // Set default value for email verification
      isFirstLogin: true, // Set default value for first login
    })

    // Save the user to the database
    await newUser.save()

    // Create a new doctor with reference to the user
    const newDoctor = new Doctor({
      email,
      name,
      userId: newUser._id, // Store reference to the user
      age,
      contactNumber,
      address,
      hospital,
    })

    // Save the doctor to the database
    await newDoctor.save()

    try {
      await addDoctorToHospital(hospital, newDoctor._id, newDoctor.name)
    } catch (error) {
      // If adding to hospital fails, continue with doctor creation
      console.error('Error adding doctor to hospital:', error)
    }

    return res.status(201).json({
      message: 'Doctor added successfully',
      doctor: newDoctor,
      user: { _id: newUser._id, email: newUser.email, role: newUser.role },
    })
  } catch (error) {
    console.error('Error adding doctor:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
    res.status(200).json(doctors)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors.', error })
  }
}

// get doctor by id
const getDoctorById = async (req, res) => {
  const { id } = req.params
  try {
    const doctor = await Doctor.findById(id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })

    // Get the associated user data
    const user = await User.findById(doctor.userId)
    if (!user)
      return res.status(404).json({ message: 'Associated user not found.' })

    // Get the doctor's patients
    const patients = await Patient.find({ doctorIds: doctor._id })

    // Combine doctor, user, and patients data
    const doctorData = {
      ...doctor.toObject(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isFirstLogin: user.isFirstLogin,
      },
      patients: patients,
    }

    res.status(200).json(doctorData)
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving doctor.', error })
  }
}

// update doctor
const updateDoctor = async (req, res) => {
  const { id } = req.params
  const { email, name, hospital, ...otherFields } = req.body

  try {
    // Find the doctor
    const doctor = await Doctor.findById(id)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    // First update the associated user if email, name, or hospital have changed
    if (email || name || hospital) {
      const user = await User.findById(doctor.userId)

      if (!user) {
        return res.status(404).json({
          message: 'Associated user not found. Doctor record may be corrupted.',
        })
      }

      // Update user details
      if (name) user.name = name
      if (email) user.email = [email]
      if (hospital) user.area = [hospital]

      await user.save()
    }

    // Then update the doctor record
    const updatedDoctor = await Doctor.findByIdAndUpdate(id, req.body, {
      new: true,
    })

    res.status(200).json({
      message: 'Doctor updated successfully',
      doctor: updatedDoctor,
    })
  } catch (error) {
    res.status(500).json({ message: 'Error updating doctor.', error })
  }
}

// delete a doctor
const deleteDoctor = async (req, res) => {
  const { id } = req.params
  try {
    // Find the doctor to get the userId
    const doctor = await Doctor.findById(id)

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    // Delete the user associated with this doctor
    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId)
    }

    // Delete the doctor record
    await Doctor.findByIdAndDelete(id)

    res
      .status(200)
      .json({ message: 'Doctor and associated user deleted successfully.' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting doctor.', error })
  }
}

const registerPatient = async (req, res) => {
  const { patientEmail, patientContactNumber } = req.body

  try {
    // The doctorId is now available in req.user.id after passing through the checkRole middleware
    const doctorId = req.user.id

    // Find the patient user by email and contact number
    const patientUser = await User.findOne({
      email: patientEmail,
      contactNumber: patientContactNumber,
    })

    if (!patientUser) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    // Find the doctor by doctorId
    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    // Add the patient's ID to the doctor's patientIds field if it's not already added
    if (!doctor.patientIds.includes(patientUser._id)) {
      doctor.patientIds.push(patientUser._id)
      await doctor.save()
    }

    return res
      .status(200)
      .json({ message: 'Patient registered to doctor successfully', doctor })
  } catch (error) {
    console.error('Error registering patient:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

const loginDoctor = async (req, res) => {
  const { email, password } = req.body

  try {
    // Check if the doctor exists
    const doctor = await Doctor.findOne({ email })
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    // Check if the password is correct
    if (password !== '12345') {
      // Assuming temporary password is "12345"
      return res.status(401).json({ message: 'Invalid password.' })
    }

    // Successful login
    return res.status(200).json({ message: 'Login successful.', doctor })
  } catch (error) {
    console.error('Error logging in doctor:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Get count of all doctors
const getDoctorCount = async (req, res) => {
  try {
    const count = await Doctor.countDocuments()
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all patients for a specific doctor
const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.params.id
    const doctor = await Doctor.findById(doctorId)

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    // Assuming patientIds is an array of patient IDs in the doctor model
    const patients = await Patient.find({ _id: { $in: doctor.patientIds } })
    res.status(200).json(patients)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get doctor's own data
const getDoctorOwnData = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id })
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    // Get the associated user data
    const user = await User.findById(doctor.userId)
    if (!user) {
      return res.status(404).json({ message: 'Associated user not found.' })
    }

    // Get the doctor's patients
    const patients = await Patient.find({ doctorIds: doctor._id })

    // Combine doctor, user, and patients data
    const doctorData = {
      ...doctor.toObject(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isFirstLogin: user.isFirstLogin,
      },
      patients: patients,
    }

    res.status(200).json(doctorData)
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving doctor data.', error })
  }
}

// Assign multiple patients to a doctor
const assignPatientsToDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params
    const { patientIds } = req.body

    // Find the doctor
    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    // Find all patients to verify they exist and are from the same hospital
    const patients = await Patient.find({
      _id: { $in: patientIds },
      hospital: doctor.hospital,
    })

    if (patients.length !== patientIds.length) {
      return res.status(400).json({
        message:
          'Some patients were not found or are not from the same hospital',
      })
    }

    // Add patients to doctor's patientIds array if not already present
    for (const patientId of patientIds) {
      if (!doctor.patientIds.includes(patientId)) {
        doctor.patientIds.push(patientId)
      }
    }

    await doctor.save()

    res.status(200).json({
      message: 'Patients assigned successfully',
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        patientIds: doctor.patientIds,
      },
    })
  } catch (error) {
    console.error('Error assigning patients:', error)
    res
      .status(500)
      .json({ message: 'Error assigning patients', error: error.message })
  }
}

// Remove a patient from a doctor
const removePatientFromDoctor = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params

    // Find the doctor
    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    // Find the patient
    const patient = await Patient.findById(patientId)
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    // Verify patient is from the same hospital as doctor
    if (patient.hospital !== doctor.hospital) {
      return res.status(400).json({
        message: 'Patient is not from the same hospital as the doctor',
      })
    }

    // Remove patient from doctor's patientIds array
    doctor.patientIds = doctor.patientIds.filter(
      (id) => id.toString() !== patientId
    )
    await doctor.save()

    res.status(200).json({
      message: 'Patient removed successfully',
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        patientIds: doctor.patientIds,
      },
    })
  } catch (error) {
    console.error('Error removing patient:', error)
    res
      .status(500)
      .json({ message: 'Error removing patient', error: error.message })
  }
}

// Export the controller functions
module.exports = {
  addDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  registerPatient,
  loginDoctor,
  getDoctorCount,
  getDoctorPatients,
  getDoctorOwnData,
  assignPatientsToDoctor,
  removePatientFromDoctor,
}

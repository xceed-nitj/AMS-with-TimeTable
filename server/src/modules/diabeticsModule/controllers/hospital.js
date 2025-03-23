const Hospital = require('../../../models/diabeticsModule/hospital')
const Doctor = require('../../../models/diabeticsModule/doctor')
const Patient = require('../../../models/diabeticsModule/patient')

// Create a hospital
const addHospital = async (req, res) => {
  try {
    const newHospital = new Hospital(req.body)
    const doctorIds = req.body.doctors
    const patientIds = req.body.patients

    const savedHospital = await newHospital.save()

    if (doctorIds) {
      await Doctor.updateMany(
        { _id: { $in: doctorIds } },
        { $set: { hospital: savedHospital._id } }
      )
    }

    if (patientIds) {
      await Patient.updateMany(
        { _id: { $in: patientIds } },
        { $set: { hospital: savedHospital._id } }
      )
    }
    res.status(201).json(savedHospital)
  } catch (error) {
    res.status(500).json({ message: 'Error creating hospital.', error })
  }
}

// const addPatientToHospital = async (hospitalName, patientId, patientName) => {
//   try {
//     const hospital = await Hospital.findOne({ name: hospitalName })

//     if (!hospital) {
//       throw new Error('Hospital not found')
//     }

//     // Add patient object to the hospital's patients array
//     hospital.patients.push({ patientId, name: patientName })
//     await hospital.save()
//   } catch (error) {
//     console.error('Error updating hospital with patient:', error)
//     throw error // re-throw to handle in calling function
//   }
// }

// Get all
const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find()
    res.status(200).json(hospitals)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospitals.', error })
  }
}

// Get a hospital by ID
const getHospitalById = async (req, res) => {
  const { id } = req.params
  try {
    const hospital = await Hospital.findById(id)
    const doctors = await Doctor.find({ hospital: hospital._id })
    const patients = await Patient.find({ hospital: hospital._id })
    if (!hospital)
      return res.status(404).json({ message: 'Hospital not found.' })
    res.status(200).json({ hospital, doctors, patients })
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving hospital.', error })
  }
}

// Update hospital by id
const updateHospital = async (req, res) => {
  const { id } = req.params
  const fields = req.body
  try {
    const updated = await Hospital.findByIdAndUpdate(id, fields, { new: true })
    if (!updated)
      return res.status(404).json({ message: 'Hospital not found.' })
    res.status(200).json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Error updating hospital.', error })
  }
}

// Delete a hospital
const deleteHospital = async (req, res) => {
  const { id } = req.params
  try {
    const hospital = await Hospital.findOneAndDelete(id)
    if (!hospital)
      return res.status(404).json({ message: 'Hospital not found.' })
    res.status(200).json({ message: 'Hospital deleted.' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting hospital', error })
  }
}

// Get count of all hospitals
const getHospitalCount = async (req, res) => {
  try {
    const count = await Hospital.countDocuments()
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all doctors assigned to a hospital
const getHospitalDoctors = async (req, res) => {
  const { id } = req.params
  try {
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' })
    }

    const doctors = await Doctor.find({ hospital: hospital._id })
    res.status(200).json(doctors)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospital doctors.', error })
  }
}

// Get all patients assigned to a hospital
const getHospitalPatients = async (req, res) => {
  const { id } = req.params
  try {
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' })
    }

    // Get all patients assigned to this hospital
    const patients = await Patient.find({ hospital: hospital._id })
    res.status(200).json(patients)
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching hospital patients.', error })
  }
}

// Get all unassigned doctors (not assigned to any hospital)
const getUnassignedDoctors = async (req, res) => {
  const { hospitalId } = req.params
  try {
    const hospital = await Hospital.findById(hospitalId)
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' })
    }

    // Get all doctors that are not assigned to this hospital
    const doctors = await Doctor.find({ hospital: null })
    res.status(200).json(doctors)
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching unassigned doctors.', error })
  }
}

// Assign multiple doctors to a hospital
const assignDoctorsToHospital = async (req, res) => {
  const { id } = req.params
  const { doctorIds } = req.body

  try {
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' })
    }

    // Update each doctor's hospital field
    await Doctor.updateMany(
      { _id: { $in: doctorIds } },
      { $set: { hospital: hospital._id } }
    )

    res.status(200).json({ message: 'Doctors assigned successfully.' })
  } catch (error) {
    res.status(500).json({ message: 'Error assigning doctors.', error })
  }
}

// Remove a doctor from a hospital
const removeDoctorFromHospital = async (req, res) => {
  const { id, doctorId } = req.params
  try {
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' })
    }

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    // Remove doctor from hospital's doctors array
    hospital.doctors = hospital.doctors.filter(
      (d) => d.dcotorId.toString() !== doctorId
    )
    await hospital.save()

    // Update doctor's hospital field to null
    doctor.hospital = null
    await doctor.save()

    res.status(200).json({ message: 'Doctor removed successfully.' })
  } catch (error) {
    res.status(500).json({ message: 'Error removing doctor.', error })
  }
}

module.exports = {
  addHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  // addPatientToHospital,
  // addDoctorToHospital,
  getHospitalCount,
  getHospitalDoctors,
  getHospitalPatients,
  getUnassignedDoctors,
  assignDoctorsToHospital,
  removeDoctorFromHospital,
}

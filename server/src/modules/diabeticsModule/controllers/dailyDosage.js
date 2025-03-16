const DailyDosage = require('../../../models/diabeticsModule/dailyDosage')

// Create a dosage entry
const addDosage = async (req, res) => {
  try {
    const newDose = new DailyDosage(req.body)
    await newDose.save()
    res.status(201).json(newDose)
  } catch (error) {
    res.status(500).json(error)
  }
}

// Get all dosages for a patient
const getAllDosages = async (req, res) => {
  const { patientId } = req.params
  try {
    const dosages = await DailyDosage.find({ patientId })
    res.status(200).json(dosages)
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error retrieving daily dosage records', error })
  }
}

// Get dosage by Id
const getDosageById = async (req, res) => {
  const { id } = req.params
  try {
    const dose = await DailyDosage.findById(id)
    if (!dose) return res.status(404).json({ message: 'Dosage not found.' })
    res.status(200).json(dose)
  } catch (error) {
    res.status(500).json({ message: 'Error getting sick day', error })
  }
}

// Update a dosage
const updateDosage = async (req, res) => {
  const { id } = req.params
  const edited = req.body
  try {
    const dosage = await DailyDosage.findByIdAndUpdate(id, edited, {
      new: true,
    })
    if (!dosage) return res.status(404).json({ message: 'Dosage not found.' })
    res.status(200).json(dosage)
  } catch (error) {
    res.status(500).json({ message: 'Error updating dosage', error })
  }
}

// Delete a dosage
const deleteDosage = async (req, res) => {
  const { id } = req.params
  try {
    const deleteDosage = await DailyDosage.findByIdAndDelete(id)
    if (!deleteDosage)
      return res.status(404).json({ message: 'Dosage not found.' })

    res.status(200).json({ message: 'Dosage deleted.' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting dosage', error })
  }
}

// Get count of all daily dosages
const getDailyDosageCount = async (req, res) => {
  try {
    const count = await DailyDosage.countDocuments()
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get latest reading for a patient
const getLatestReading = async (req, res) => {
  try {
    const patientId = req.params.patientId

    const latestReading = await DailyDosage.findOne({ patientId })
      .sort({ 'data.date': -1, createdAt: -1 })
      .limit(1)

    if (!latestReading) {
      return res
        .status(404)
        .json({ message: 'No readings found for this patient' })
    }

    res.status(200).json(latestReading.data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get readings for a patient by date
const getReadingsByDate = async (req, res) => {
  try {
    const { patientId, date } = req.params

    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const readings = await DailyDosage.find({
      patientId,
      'data.date': { $gte: startDate, $lte: endDate },
    }).sort({ 'data.date': 1 })

    res.status(200).json(readings)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get readings for a patient within a date range
const getReadingsByDateRange = async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.params

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const readings = await DailyDosage.find({
      patientId,
      'data.date': { $gte: start, $lte: end },
    }).sort({ 'data.date': 1 })

    res.status(200).json(readings)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  addDosage,
  getAllDosages,
  getDosageById,
  updateDosage,
  deleteDosage,
  getDailyDosageCount,
  getLatestReading,
  getReadingsByDate,
  getReadingsByDateRange,
}

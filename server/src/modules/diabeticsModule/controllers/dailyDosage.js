const DailyDosage = require("../../../models/diabeticsModule/dailyDosage")

// Create a dosage entry
const addDosage = async(req, res) => {
    try {
        const newDose = new DailyDosage(req.body);
        await newDose.save();        
        res.status(201).json(newDose);
    } catch (error) {
        res.status(500).json(error);
    }
};

// Get all dosages for a patient
const getAllDosages = async(req, res) => {
    const {patientId} = req.params;
    try {
        const dosages = await DailyDosage.find({patientId});
        res.status(200).json(dosages);
    } catch (error) {
        res.status(500).json({message: "Error retrieving daily dosage records", error});        
    }
};

// Get dosage by Id
const getDosageById = async(req, res) => {
    const {id} = req.params;
    try {
        const dose = await DailyDosage.findById(id);
        if (!dose) return res.status(404).json({message: "Dosage not found."});
        res.status(200).json(dose);
    } catch (error) {
        res.status(500).json({message: "Error getting sick day",error});        
    }
};

// Update a dosage
const updateDosage = async(req, res) => {
    const {id} = req.params;
    const edited = req.body;
    try {
        const dosage = await DailyDosage.findByIdAndUpdate(id, edited, { new: true });
        if (!dosage) return res.status(404).json({message: "Dosage not found."});
        res.status(200).json(dosage);
    } catch (error) {
        res.status(500).json({message: "Error updating dosage", error});        
    }
};

// Delete a dosage
const deleteDosage = async(req, res) => {
    const {id} = req.params;
    try {
        const deleteDosage = await DailyDosage.findByIdAndDelete(id);
        if (!deleteDosage) return res.status(404).json({message: "Dosage not found."});

        res.status(200).json({message: "Dosage deleted."})
    } catch (error) {
        res.status(500).json({message: "Error deleting dosage", error});
    }
};

module.exports = {addDosage, getAllDosages, getDosageById, updateDosage, deleteDosage};
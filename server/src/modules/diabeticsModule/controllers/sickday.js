const { default: mongoose } = require("mongoose");
const SickDay = require("../../../models/diabeticsModule/sickday");

// create a sick day
const addSickDay = async(req, res) => {
    const input = req.body;
    try {
        const newSick = new SickDay(input);
        await newSick.save();
        res.status(201).json(newSick);
    } catch (error) {
        res.status(500).json({message: "Error creating sick day.", error});
    }
};

// Get sick days for a patient
const getSickDays = async (req, res) => {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ message: "Invalid patient ID format." });

    try {
        const sicks = await SickDay.find({ patientId });
        res.status(200).json(sicks);
    } catch (error) {
        console.error("Error retrieving sick days:", error); // Logging for debugging
        res.status(500).json({ message: "Error retrieving sick days.", error });
    }
};

// get sick day by id
const getSickDayById = async(req, res) => {
    const {id} = req.params;
    try {
        const sick = await SickDay.findById(id);
        if (!sick) return res.status(404).json({message: "Sick day not found."});
        res.status(200).json(sick);
    } catch (error) {
        res.status(500).json({message: "Error retrieving sick day.", error});
    }
};

// update a sick day
const updateSickDay = async(req, res) => {
    const {id} = req.params;
    const edited = req.body;
    try {
        const sick = await SickDay.findByIdAndUpdate(id, edited, {new: true});
        if (!sick) return res.status(404).json({message: "Sick day not found."});
        res.status(200).json(sick);
    } catch (error) {
        res.status(500).json({message: "Error updating sick day.", error});
    }
};

// delete a sick day
const deleteSickDay = async(req, res) => {
    const {id} = req.params;
    try {
        const deleteSick = await SickDay.findByIdAndDelete(id);
        if (!deleteSick) return res.status(404).json({message: "Sick Day not found."});
        res.status(200).json({message: "Sick day deleted."});
    } catch (error) {
        res.status(500).json({message: "Error deleting sick day.", error});
    }
};

module.exports = {addSickDay, getSickDayById, getSickDays, updateSickDay, deleteSickDay};
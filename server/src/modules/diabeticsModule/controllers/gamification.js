const Gamification = require("../../../models/diabeticsModule/gamification")

// add gamification
const addGamification = async(req, res) => {
    try {
        const newPlayer = new Gamification(req.body);
        await newPlayer.save();
        res.status(201).json(newPlayer);
    } catch (error) {
        res.status(500).json({message: "Error creating gamification", error});
    }
};

// get all gamification
const getAllGamifications = async(req, res) => {
    try {
        const allGamifications = await Gamification.find();
        res.status(200).json(allGamifications);
    } catch (error) {
        res.status(500).json({message: "Error fetching gamifications.", error});
    }
};

// get gamification by id
const getGamificationById = async(req, res) => {
    const {id} = req.params;
    try {
        const gamification = await Gamification.findById(id);
        if (!gamification) return res.status(404).json({message: "Gamification not found."});
        res.status(200).json(gamification);
    } catch (error) {
        res.status(500).json({message: "Error retrieving gamification.", error});
    }
};

// update gamification by id
const updateGamification = async(req, res) => {
    const {id} = req.params;
    try {
        const updated = await Gamification.findByIdAndUpdate(id, req.body, {new: true});
        if (!updated) return res.status(404).json({message: "Gamification not found."});
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({message: "Error updating gamification.", error});
    }
};

// delete gamification
const deleteGamification = async(req, res) => {
    const {id} = req.params;
    try {
        const gamification = await Gamification.findOneAndDelete(id);
        if (!gamification) return res.status(404).json({message: "Gamification not found."});
        res.status(200).json({message: "Gamification deleted."});
    } catch (error) {
        res.status(500).json({message: "Error deleting gamification."});
    }
};

module.exports = {addGamification, getGamificationById, getAllGamifications, updateGamification, deleteGamification};
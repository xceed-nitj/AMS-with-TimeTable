const DefaultQuestion = require('../../../models/reviewModule/defaultQuestion');

const addDefaultQuestion = async (req, res) => {
    const { show, type, question, options } = req.body;

    try {
        const newDefaultQuestion = new DefaultQuestion({
            show,
            type,
            question,
            options
        });

        await newDefaultQuestion.save();
        res.status(201).json(newDefaultQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error creating default question", error });
    }
};

const getDefaultQuestions = async (req, res) => {
    try {
        const defaultQuestions = await DefaultQuestion.find();
        res.status(200).json(defaultQuestions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching default questions", error });
    }
};

const getDefaultQuestionById = async (req, res) => {
    const { id } = req.params;
    try {
        const defaultQuestion = await DefaultQuestion.findById(id);
        if (!defaultQuestion) return res.status(404).json({ message: "Default question not found" });
        res.status(200).json(defaultQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error fetching default question", error });
    }
};

const updateDefaultQuestion = async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;

    try {
        const updatedDefaultQuestion = await DefaultQuestion.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedDefaultQuestion) return res.status(404).json({ message: "Default question not found" });
        res.status(200).json(updatedDefaultQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error updating default question", error });
    }
};

const deleteDefaultQuestion = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedDefaultQuestion = await DefaultQuestion.findByIdAndDelete(id);
        if (!deletedDefaultQuestion) return res.status(404).json({ message: "Default question not found" });
        res.status(200).json({ message: "Default question deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting default question", error });
    }
};

module.exports = {
    addDefaultQuestion,
    getDefaultQuestions,
    getDefaultQuestionById,
    updateDefaultQuestion,
    deleteDefaultQuestion
};

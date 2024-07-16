const Form = require("../../../models/reviewModule/forms");

// Create a new form
const createForm = async (req, res) => {
    try {
        const newForm = new Form(req.body);
        await newForm.save();
        res.status(201).json(newForm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all forms
const getAllForms = async (req, res) => {
    try {
        const forms = await Form.find();
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a form by ID
const getFormById = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (!form) return res.status(404).json({ message: "Form not found" });
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a form
const updateForm = async (req, res) => {
    try {
        const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!form) return res.status(404).json({ message: "Form not found" });
        res.status(200).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a form
const deleteForm = async (req, res) => {
    try {
        const form = await Form.findByIdAndDelete(req.params.id);
        if (!form) return res.status(404).json({ message: "Form not found" });
        res.status(200).json({ message: "Form deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createForm,
    getAllForms,
    getFormById,
    updateForm,
    deleteForm
};

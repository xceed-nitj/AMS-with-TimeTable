const FormAnswer = require('../../../models/reviewModule/formAnswers');
const Form = require('../../../models/reviewModule/forms');
const Event = require('../../../models/reviewModule/event');
const User = require("../../../models/usermanagement/user.js")

// Create a new form answer
const createFormAnswer = async (req, res) => {
  try {
    const { eventId, userId, formId, formAnswers } = req.body;

    // Validate event, user, and form
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);
    const form = await Form.findById(formId);

    if (!event || !user || !form) {
      return res.status(404).json({ message: 'Event, User, or Form not found' });
    }

    const newFormAnswer = new FormAnswer({
      eventId,
      userId,
      formId,
      formAnswers
    });

    await newFormAnswer.save();
    res.status(201).json(newFormAnswer);
  } catch (error) {
    console.error('Error creating form answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all form answers
const getFormAnswers = async (req, res) => {
  try {
    const formAnswers = await FormAnswer.find();
    res.status(200).json(formAnswers);
  } catch (error) {
    console.error('Error fetching form answers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a specific form answer by ID
const getFormAnswerById = async (req, res) => {
  try {
    const formAnswer = await FormAnswer.findById(req.params.id);

    if (!formAnswer) {
      return res.status(404).json({ message: 'Form answer not found' });
    }

    res.status(200).json(formAnswer);
  } catch (error) {
    console.error('Error fetching form answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a form answer by ID
const updateFormAnswerById = async (req, res) => {
  try {
    const updatedFormAnswer = await FormAnswer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedFormAnswer) {
      return res.status(404).json({ message: 'Form answer not found' });
    }

    res.status(200).json(updatedFormAnswer);
  } catch (error) {
    console.error('Error updating form answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a form answer by ID
const deleteFormAnswerById = async (req, res) => {
  try {
    const deletedFormAnswer = await FormAnswer.findByIdAndDelete(req.params.id);

    if (!deletedFormAnswer) {
      return res.status(404).json({ message: 'Form answer not found' });
    }

    res.status(200).json({ message: 'Form answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting form answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getFormAnswerByEventUserFormId = async (req, res) => {
  const { eventId, userId, formId } = req.params;

  try {
    const formAnswer = await FormAnswer.findOne({ eventId, userId, formId });
    if (formAnswer) {
      return res.status(200).json({ submitted: true });
    }
    return res.status(200).json({ submitted: false });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while checking the form submission.' });
  }
};
  

module.exports = {
  createFormAnswer,
  getFormAnswers,
  getFormAnswerById,
  updateFormAnswerById,
  deleteFormAnswerById,
  getFormAnswerByEventUserFormId
};


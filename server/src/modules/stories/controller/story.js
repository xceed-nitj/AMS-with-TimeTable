const Story = require('../../../models/stories/story');

const AddStory = async (req, res) => {
  try {
    const newStory = new Story({
      name: req.body.name,
      rollno: req.body.rollno,
      batch: req.body.batch,
      degree: req.body.degree,
      dept: req.body.dept,
      company: req.body.company,
      story: req.body.story,
      linkedIn: req.body.linkedIn
    });

    const savedStory = await newStory.save();
    res.status(201).json(savedStory);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while adding the story." });
  }
};

const SearchbyCompany = async (req, res) => {
  const companyName = req.params.companyName;
  try {
    const stories = await Story.find({ company: companyName });
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while searching by company name." });
  }
};

const SearchbyName = async (req, res) => {
  try {
    const studentName = req.params.name;
    const stories = await Story.find({ name: studentName });
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while searching by student name." });
  }
};

const SearchbyDept = async (req, res) => {
  try {
    const deptName = req.params.dept;
    const stories = await Story.find({ dept: deptName });
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while searching by department name." });
  }
};

const SearchbyBatch = async (req, res) => {
  try {
    const batch = req.params.batch;
    const stories = await Story.find({ batch: batch });
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while searching by batch." });
  }
};

module.exports = {
    AddStory,
    SearchbyCompany,
    SearchbyName,
    SearchbyBatch,
    SearchbyDept
};

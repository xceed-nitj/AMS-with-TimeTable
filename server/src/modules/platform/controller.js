const Platform = require("../../models/platform");
const path = require('path');

const addPlatform = async (req, res) => {
  const {roles,exemptedLinks,researchArea} = req.body;
  const newPlatform = new Platform({
    roles : roles,
    exemptedLinks : exemptedLinks,
    researchArea : researchArea,
  });
  newPlatform
    .save()
    .then((newPlatform) => res.status(200).send(newPlatform))
    .catch((err) => res.status(500).send(err));
}

const getPlatform = async (req, res) => {
    try {
      const platform = await Platform.find({});
      console.log(platform)
      res.status(200).json(platform);
    } catch (error) {
      res.status(500).send(error);
    }
};

const getPlatformById = async (req, res) => {
  const id = req.params.id;
  try {
    const platform = await Platform.find({_id : id});
    res.status(200).json(platform);
  } catch (error) {
    res.status(500).send(error);
  }
};

const updatePlatform = async (req, res) => {
    const id = req.params.id;
    if (!id) res.send("Id not found");
  
    const updateField = req.body;
  
    try {
      const platform = await Platform.findByIdAndUpdate({_id:id}, updateField, { new: true, runValidators: true });
      if (!platform) {
        return res.status(404).send({ error: 'User not found' });
      }
      res.send(platform);
    } catch (error) {
      res.status(400).send(error);
    }
};

const deletePlatform = async (req, res) => {
    const id = req.params.id;
    if (!id) res.send("Id not found");
  
    try {
      await Platform.deleteOne({ _id: id });
      res.status(200).send("Deleted Successfully");
    } catch (error) {
      res.status(500).send(error);
    }
};

const addModule = (req, res) => {
  try {
    const { name, description, yearLaunched, contributors } = req.body;
    const files = req.files;

    // Ensure contributors is an array
    let parsedContributors;
    if (Array.isArray(contributors)) {
      parsedContributors = contributors; // If it's already an array
    } else if (typeof contributors === 'string') {
      try {
        parsedContributors = JSON.parse(contributors); // Attempt to parse if it's a JSON string
        if (!Array.isArray(parsedContributors)) {
          return res.status(400).json({ message: 'Contributors should be an array.' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid contributors format.' });
      }
    } else {
      return res.status(400).json({ message: 'Contributors should be an array or valid JSON string.' });
    }

    // Ensure the number of files matches the number of contributors
    if (parsedContributors.length !== files.length) {
      return res.status(400).json({ message: 'Mismatch between contributors and uploaded images.' });
    }

    // Map contributors with their corresponding images
    const formattedContributors = parsedContributors.map((contributor, index) => ({
      ...contributor,
      image: files[index] ? files[index].path : null,
    }));

    const moduleData = {
      name,
      description,
      yearLaunched,
      contributors: formattedContributors,
    };

    console.log(moduleData); // For debugging

    res.status(200).json({ message: 'Module added successfully', data: moduleData });
  } catch (error) {
    console.error('Error in addModule:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {addPlatform,getPlatform,getPlatformById,updatePlatform,deletePlatform,addModule};


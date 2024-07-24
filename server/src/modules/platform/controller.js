const Platform = require("../../models/platform");

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

module.exports = {addPlatform,getPlatform,getPlatformById,updatePlatform,deletePlatform};


const Platform = require("../../models/platform");
const Module = require("../../models/module");
const path = require('path');
const { uploadOnCloudinary } = require("./utils/clodinary.js");

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


// GET /api/platform/exempted-links
const getExemptedLinks = async (req, res) => {
  try {
    const platform = await Platform.findOne({});
    const links = (platform?.exemptedLinks || []).map(l => {
      let s = String(l).trim(); if (!s.startsWith('/')) s = '/' + s; if (s.length>1 && s.endsWith('/')) s = s.slice(0,-1); return s;
    });
    res.status(200).json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// POST /api/platform/exempted-links
const addExemptedLink = async (req, res) => {
  let { link } = req.body;
  if (!link) return res.status(400).json({
     message: "Link is required" 
    });

  // normalize
  link = String(link).trim();
  if (!link.startsWith('/')) link = '/' + link;
  if (link.length > 1 && link.endsWith('/')) link = link.slice(0, -1);

  try {
    const updated = await Platform.findOneAndUpdate(
      {}, 
      { $addToSet: { exemptedLinks: link } },
      { new: true, upsert: true } // upsert creates Platform if missing
    );
    const normalized = (updated.exemptedLinks || []).map(l => String(l).trim());
    res.status(200).json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// const addModule = async (req, res) => {

//   try {
//     const { name, description, yearLaunched, contributors } = req.body;
//     const files = req.files || [];

//     // Ensure contributors is an array
//     let parsedContributors;
//     if (Array.isArray(contributors)) {
//       parsedContributors = contributors; // If it's already an array
//     } else if (typeof contributors === "string") {
//       try {
//         parsedContributors = JSON.parse(contributors); // Attempt to parse if it's a JSON string
//         if (!Array.isArray(parsedContributors)) {
//           return res.status(400).json({ message: "Contributors should be an array." });
//         }
//       } catch (error) {
//         return res.status(400).json({ message: "Invalid contributors format." });
//       }
//     } else {
//       return res.status(400).json({ message: "Contributors should be an array or valid JSON string." });
//     }

//     // Ensure the number of files matches the number of contributors
//     if (parsedContributors.length !== files.length) {
//       return res.status(400).json({ message: "Mismatch between contributors and uploaded images." });
//     }

//     // Upload files to Cloudinary and map contributors with their corresponding images
//     const formattedContributors = await Promise.all(
//       parsedContributors.map(async (contributor, index) => {
//         try {
//           const filePath = files[index]?.path;
//           const uploadResponse = await uploadOnCloudinary(filePath);
//           return {
//             ...contributor,
//             image: uploadResponse.secure_url, // Use Cloudinary URL
//           };
//         } catch (uploadError) {
//           console.error(`Error uploading image for contributor ${contributor.name}:`, uploadError);
//           throw new Error(`Failed to upload image for ${contributor.name}`);
//         }
//       })
//     );

//     const moduleData = {
//       name,
//       description,
//       yearLaunched,
//       contributors: formattedContributors,
//     };

//     console.log(moduleData); // For debugging

//     // Save to MongoDB
//     const newModule = new Module(moduleData);
//     await newModule.save();

//     res.status(200).json({ message: "Module added successfully", data: moduleData });
//   } catch (error) {
//     console.error("Error in addModule:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };


const addModule = async (req, res) => {
  try {
    const { name, description, yearLaunched, contributors } = req.body;
    const files = req.files || [];

    
    console.log("Received contributors (raw):", contributors);
    console.log("Received files:", files.map(f => f.originalname));

    // Parse contributors
    let parsedContributors;
    if (Array.isArray(contributors)) {
      parsedContributors = contributors;
    } else if (typeof contributors === "string") {
      try {
        parsedContributors = JSON.parse(contributors);
        if (!Array.isArray(parsedContributors)) {
          return res.status(400).json({ message: "Contributors should be an array." });
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid contributors format." });
      }
    } else {
      return res.status(400).json({ message: "Contributors should be an array or valid JSON string." });
    }

    // Map contributors with available files
    const formattedContributors = await Promise.all(
      parsedContributors.map(async (contributor, index) => {
        const file = files[index]; // Try to match image by index
        if (!file || !file.path) {
          // No image uploaded for this contributor
          return contributor;
        }

        try {
          const uploadResponse = await uploadOnCloudinary(file.path);
          return {
            ...contributor,
            image: uploadResponse.secure_url,
          };
        } catch (uploadError) {
          console.error(`Error uploading image for contributor ${contributor.name}:`, uploadError);
          throw new Error(`Failed to upload image for ${contributor.name}`);
        }
      })
    );

    const moduleData = {
      name,
      description,
      yearLaunched,
      contributors: formattedContributors,
    };

    console.log("Final module data:", moduleData);

    // Save to MongoDB
    const newModule = new Module(moduleData);
    await newModule.save();

    res.status(200).json({ message: "Module added successfully", data: moduleData });
  } catch (error) {
    console.error("Error in addModule:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};


// Get all modules
const getModules = async (req, res) => {
  try {
    const modules = await Module.find();
    console.log("modules:",modules);
    res.status(200).json(modules);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch modules" });
  }
};


// Get a single module by ID
const getModuleById = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const module = await Module.findById(moduleId);
    console.log('moduleId:', moduleId);
    
    if (!module) {
      console.log('module:', module);
      return res.status(404).json({ error: "Module not found" });
    }
    res.status(200).json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ error: "Failed to fetch module" });
  }
};


// Update a module
const updateModule = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const { name, description, yearLaunched, contributors } = req.body;
    const files = req.files || [];

    console.log("Body:", req.body);
    console.log("Files:", files);

    // Parse and validate contributors if necessary
    let parsedContributors;
    if (Array.isArray(contributors)) {
      parsedContributors = contributors;
    } else if (typeof contributors === "string") {
      try {
        parsedContributors = JSON.parse(contributors);
        if (!Array.isArray(parsedContributors)) {
          return res.status(400).json({ error: "Contributors should be an array." });
        }
      } catch (error) {
        return res.status(400).json({ error: "Invalid contributors format." });
      }
    }

    // Handle file uploads and map contributors with their corresponding images
    const updatedContributors = files.length
      ? await Promise.all(
          parsedContributors.map(async (contributor, index) => {
            try {
              const filePath = files[index]?.path;
              const uploadResponse = filePath
                ? await uploadOnCloudinary(filePath)
                : { secure_url: contributor.image }; // Retain existing image if no file provided
              return {
                ...contributor,
                image: uploadResponse.secure_url,
              };
            } catch (uploadError) {
              console.error(`Error uploading image for contributor ${contributor.name}:`, uploadError);
              throw new Error(`Failed to upload image for ${contributor.name}`);
            }
          })
        )
      : parsedContributors;

    // Update the module
    const updatedModule = await Module.findByIdAndUpdate(
      moduleId,
      {
        name,
        description,
        yearLaunched,
        contributors: updatedContributors,
      },
      { new: true }
    );

    if (!updatedModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.status(200).json({ message: "Module updated successfully", updatedModule });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Failed to update module", details: error.message });
  }
};



// Delete a module
const deleteModule = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const deletedModule = await Module.findByIdAndDelete(moduleId);

    if (!deletedModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.status(200).json({ message: "Module deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete module" });
  }
};

module.exports = {addPlatform,getPlatform,getPlatformById,updatePlatform,deletePlatform,addModule, getModules, getModuleById, updateModule, deleteModule,getExemptedLinks,addExemptedLink};


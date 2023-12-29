const express = require("express");
const router = express.Router();
const reader = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const { findDuplicateSubjects } = require('../timetableModule/helper/findduplicates');

const modelPaths = {
  faculty: "../../models/faculty",
  subject: "../../models/subject",
  masterroom: "../../models/masterroom",
  mastersem: "../../models/mastersem",
};

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Functions for different objectTypes to find duplicates
async function findDuplicatesByType(objectType, code) {
  if (objectType === 'subject') {
    return await findDuplicateSubjects(code);
  }
  // else if (objectType === 'anotherType') {
  //   return await findDuplicatesForAnotherType(code);
  // }
  return [];
}

router.post('/:objectType', upload.single('csvFile'), async (req, res) => {
  
  const filePath = req.file.path;
  const file = reader.readFile(filePath);
  const sheetsArray = file.SheetNames;
  const duplicateSet = new Map(); // Use a Map to store unique duplicates for each object type
  const objectType = req.params.objectType;

  for (let i = 0; i < sheetsArray.length; i++) {
    const sheet = reader.utils.sheet_to_json(file.Sheets[sheetsArray[i]]);
    const mongooseSchema = require(modelPaths[objectType]);

    for (const row of sheet) {
      const currentCode = req.body.code;
      row.code=currentCode;

      const duplicates = await findDuplicatesByType(objectType, currentCode);

      if (duplicates.length > 0) {
        if (!duplicateSet.has(objectType)) {
          duplicateSet.set(objectType, new Set());
        }

        duplicates.forEach((duplicate) => {
          duplicateSet.get(objectType).add(duplicate);
        });
      }
    

      const schema = new mongooseSchema(row);
      schema.save();
    }
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error deleting the file');
    } else {
      const duplicatesObject = {};
      duplicateSet.forEach((value, key) => {
        duplicatesObject[key] = Array.from(value);
      });

      const objectKeys = Object.keys(duplicatesObject);
      let message = '';

      if (objectKeys.length > 0) {
        objectKeys.forEach((key) => {
          message += `Duplicate entries detected for ${key}: ${duplicatesObject[key]}\n`;
        });
        res.status(200).json({ message });
      } else {
        res.send(`CSV file uploaded, data saved to MongoDB for ${objectType}, and file deleted.`);
      }
    }
  });
});

module.exports = router;

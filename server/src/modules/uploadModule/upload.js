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

router.post('/:objectType', upload.single('csvFile'), async (req, res) => {
  const filePath = req.file.path;
  const file = reader.readFile(filePath);
  const sheetsArray = file.SheetNames;
  const duplicateSubjectsSet = new Set(); // Use a Set to store unique duplicate subjects

  for (let i = 0; i < sheetsArray.length; i++) {
    const sheet = reader.utils.sheet_to_json(file.Sheets[sheetsArray[i]]);

    for (const row of sheet) {
      const objectType = req.params.objectType;
      const mongooseSchema = require(modelPaths[objectType]);

      if (objectType === 'subject') {
        const currentCode = req.body.code;
        row.code = currentCode;
        const duplicates = await findDuplicateSubjects(currentCode);

        if (duplicates.length > 0) {
          duplicates.forEach((duplicate) => {
            duplicateSubjectsSet.add(duplicate);
          });
        }
      }

      const schema = new mongooseSchema(row);
      schema.save();
    }
  }

  // Delete the uploaded file after saving data to MongoDB
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error deleting the file');
    } else {
      const duplicateSubjectsArray = Array.from(duplicateSubjectsSet);
      if (duplicateSubjectsArray.length > 0) {
        res.status(200).json({ message: 'Duplicate entries detected for the following subjects:', duplicateSubjects: duplicateSubjectsArray });
      } else {
        res.send('CSV file uploaded, data saved to MongoDB, and file deleted.');
      }
    }
  });
});

module.exports = router;

const multer = require('multer');
const path = require("path");
const fs = require('fs');  // Include the 'fs' module

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { eventId} = req.body;  // Extract eventId and userId from the request body
    const userId = req.user.id;
    // Define the base path for event and user folders
    const eventFolder = path.join(__dirname, '/uploads', eventId, userId);
    const codeUploadPath = path.join(eventFolder, 'codeupload');
    const paperUploadPath = path.join(eventFolder, 'paperupload');

    // Ensure the directories exist, create them if they don't
    if (!fs.existsSync(codeUploadPath)) {
      fs.mkdirSync(codeUploadPath, { recursive: true });
    }
    if (!fs.existsSync(paperUploadPath)) {
      fs.mkdirSync(paperUploadPath, { recursive: true });
    }

    // Determine the correct folder based on the file field name
    let uploadPath;
    if (file.fieldname === 'codeFile') {
      uploadPath = codeUploadPath;
    } else if (file.fieldname === 'pdfFile') {
      uploadPath = paperUploadPath;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalFileName = path.parse(file.originalname).name;
    const newFileName = `${originalFileName}_${timestamp}${path.extname(file.originalname)}`;
    cb(null, newFileName);
  },
});

const upload = multer({ storage: storage });

const fileUploadMiddleware = (req, res, next) => {
  upload.fields([
    { name: 'pdfFile', maxCount: 1 },   // Upload 1 file with field name 'pdfFile'
    { name: 'codeFile', maxCount: 1 }   // Upload 1 file with field name 'codeFile'
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).send('Error uploading file.');
    }
    if (!req.files || (!req.files.pdfFile && !req.files.codeFile)) {
      return res.status(400).send('No files uploaded.');
    }

    // Attach file information to the request object
    if (req.files.pdfFile) {
      req.fileName = `${req.body.eventId}/${req.user.id}/paperupload/${req.files.pdfFile[0].filename}`;
    }
    if (req.files.codeFile) {
      req.codeName = `${req.body.eventId}/${req.user.id}/codeupload/${req.files.codeFile[0].filename}`;
    }
    req.track = req.body.tracks;
    req.title = req.body.title;
    req.abstract = req.body.abstract;
    req.authors = req.body.authors;
    req.terms = req.body.terms;
    next();
  });
};

module.exports = fileUploadMiddleware;

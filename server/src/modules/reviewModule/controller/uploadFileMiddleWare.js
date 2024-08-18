const multer = require('multer');
const path = require("path");
const fs = require('fs');

// Create a multer instance without storage configuration
const upload = multer();

const fileUploadMiddleware = (req, res, next) => {
  // Use the memory storage
  upload.fields([
    { name: 'pdfFile', maxCount: 1 },
    { name: 'codeFile', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).send('Error uploading file.');
    }
    if (!req.files || (!req.files.pdfFile && !req.files.codeFile)) {
      return res.status(400).send('No files uploaded.');
    }

    const eventId = req.body.eventId;
    const userId = req.body.user;

    if (!eventId || !userId) {
      console.log("event id or user id is not valid");
      return res.status(400).send('Invalid event ID or user ID.');
    }

    const eventFolder = path.join(__dirname, '../../../../uploads/reviewModule', eventId, userId);
    const codeUploadPath = path.join(eventFolder, 'codeupload');
    const paperUploadPath = path.join(eventFolder, 'paperupload');

    // Ensure the directories exist, create them if they don't
    if (!fs.existsSync(codeUploadPath)) {
      fs.mkdirSync(codeUploadPath, { recursive: true });
    }
    if (!fs.existsSync(paperUploadPath)) {
      fs.mkdirSync(paperUploadPath, { recursive: true });
    }

    // Function to save file
    const saveFile = (file, uploadPath) => {
      const timestamp = Date.now();
      const originalFileName = path.parse(file.originalname).name;
      const newFileName = `${originalFileName}_${timestamp}${path.extname(file.originalname)}`;
      const filePath = path.join(uploadPath, newFileName);
      fs.writeFileSync(filePath, file.buffer);
      return newFileName;
    };

    // Save files and attach information to the request object
    if (req.files.pdfFile) {
      const fileName = saveFile(req.files.pdfFile[0], paperUploadPath);
      req.fileName = `${eventId}/${userId}/paperupload/${fileName}`;
    }
    if (req.files.codeFile) {
      const fileName = saveFile(req.files.codeFile[0], codeUploadPath);
      req.codeName = `${eventId}/${userId}/codeupload/${fileName}`;
    }
    req.id = req.body.pid;
    req.track = req.body.tracks;
    req.title = req.body.title;
    req.abstract = req.body.abstract;
    req.authors = req.body.authors;
    req.terms = req.body.terms;
    try {
      req.ps = JSON.parse(req.body.pseudo_authors);
    } catch (error) {
      console.error("Error parsing pseudo_authors:", error);
      req.ps = []; // Set to empty array if parsing fails
    }

    console.log("Parsed pseudo_authors:", req.ps);
    next();
  });
};

module.exports = fileUploadMiddleware;
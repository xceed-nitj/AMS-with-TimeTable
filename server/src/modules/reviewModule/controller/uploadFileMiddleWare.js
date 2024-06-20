const multer = require('multer');
const path = require("path");
const user = require("../../usermanagement/routes/user");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '/uploads')); 
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
      req.fileName = req.files.pdfFile[0].filename;
    }
    if (req.files.codeFile) {
      req.codeName = req.files.codeFile[0].filename;
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

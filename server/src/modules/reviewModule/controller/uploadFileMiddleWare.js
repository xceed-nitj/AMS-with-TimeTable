const multer = require('multer');
const path = require("path");

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
  upload.single('pdfFile')(req, res, (err) => {
    if (err) {
      return res.status(400).send('Error uploading file.');
    }
    req.fileName = req.file.filename;
    req.title = req.body.title;
    req.abstract = req.body.abstract;
    next();
  });
};

module.exports = fileUploadMiddleware;

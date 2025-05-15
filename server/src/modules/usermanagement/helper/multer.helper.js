const multer = require("multer");
const path = require("path");
const fs = require("fs")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    // Define the path
    const p = path.join(__dirname, '../../../../uploads/userUploads');
    
    // Check if the directory exists, if not, create it
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true }); // Recursive to ensure parent directories are created
    }

    cb(null, p);
  },
  filename: function (req, file, cb) {
    const newFileName = `${Date.now()}-${file.originalname}`;
    file.newfilename = newFileName; 
    cb(null, newFileName );
  },
});
const upload = multer({ storage: storage });
module.exports = {
  upload,
};
const multer = require("multer");
const path = require("path");
const fs = require("fs")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    // Define the path
    const p = path.join(__dirname, '../../../../uploads/certificateModuleImages');
    
    // Check if the directory exists, if not, create it
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true }); // Recursive to ensure parent directories are created
    }

    cb(null, p);
  },
  filename: function (req, file, cb) {
    const userId = req?.user?.id;
    const certiType = req?.body?.certiType;
    const eventId = req?.params?.id;
    const fieldname = file.fieldname;
    const uniqueSuffix = `${eventId}-${certiType}-${fieldname}`;
    cb(null, `${userId}-${uniqueSuffix}.png`);
  },
});
const upload = multer({ storage: storage });
module.exports = {
  upload,
};
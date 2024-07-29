const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/certificateModuleImages");
  },
  filename: function (req, file, cb) {
    const userId = req?.user?.id
    if (userId) {
      const uniqueSuffix = Date.now()
      cb(null, `${userId}-${file.fieldname}-${uniqueSuffix}.png`);
    }else{
      cb(null, `${file.originalname}.html`);
    }
  },
});
const upload = multer({ storage: storage });
module.exports = {
  upload,
};
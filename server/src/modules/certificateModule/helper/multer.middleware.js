const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/certificateModuleImages");
  },
  filename: function (req, file, cb) {
    const eventId = req.params.id
    const certiType = req.body.certiType
    cb(null,`${eventId}-${certiType}-${file.fieldname}.png`);
  },
});

const upload = multer({ storage: storage });
module.exports = {
  upload,
};

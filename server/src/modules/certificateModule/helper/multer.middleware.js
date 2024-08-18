const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/certificateModuleImages");
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
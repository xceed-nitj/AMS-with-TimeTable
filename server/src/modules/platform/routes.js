const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { checkRole } = require("../checkRole.middleware");

const {addPlatform,getPlatform,updatePlatform,deletePlatform,getPlatformById,addModule, getModules, getModuleById, updateModule, deleteModule,} = require('../platform/controller');

const platformWriteAccess = checkRole(['admin']);

router.post("/add", platformWriteAccess, addPlatform);
router.get("/getplatform", getPlatform);
router.get("/get/:id", getPlatformById);
router.patch("/update/:id", platformWriteAccess, updatePlatform);
router.delete("/delete/:id", platformWriteAccess, deletePlatform);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Save uploaded files to 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Unique file names
  },
});
const upload = multer({ storage });

// Define module routes
router.post('/add-module', platformWriteAccess, upload.array('contributorImages', 10), addModule);
router.get("/get-modules", getModules);
router.get("/get-modules/:id", getModuleById);
router.put("/update-module/:id", platformWriteAccess, updateModule);
router.delete("/delete-module/:id", platformWriteAccess, deleteModule);


module.exports = router;
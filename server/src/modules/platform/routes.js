const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const {addPlatform,getPlatform,updatePlatform,deletePlatform,getPlatformById,addModule, getModules, getModuleById, updateModule, deleteModule,} = require('../platform/controller');

router.post("/add", addPlatform);
router.get("/getplatform", getPlatform);
router.get("/get/:id", getPlatformById);
router.patch("/update/:id", updatePlatform);
router.delete("/delete/:id", deletePlatform);

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
router.post('/add-module', upload.array('contributorImages', 10), addModule);
router.get("/get-modules", getModules);
router.get("/get-modules/:id", getModuleById);
router.put("/update-module/:id", updateModule);
router.delete("/delete-module/:id", deleteModule);


module.exports = router;
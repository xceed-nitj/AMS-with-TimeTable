const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'deysmiqsk',
  api_key: 856476816176411,
  api_secret: 'pRBth8050sKX5m1MbzxM0fKcpNE',
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve("src/images/");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // Remove local file after successful upload
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // Remove local file in case of an error
    fs.unlinkSync(localFilePath);
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

// Export the utilities
module.exports = { cloudinary, upload, uploadOnCloudinary };

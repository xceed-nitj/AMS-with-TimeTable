const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const Paper = require("../../../models/reviewModule/paper");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, req.params.id); // Use the id as the filename
  },
});

const upload = multer({ storage: storage });

const fileUploadMiddleware = (req, res, next) => {
  upload.single("pdfFile")(req, res, (err) => {
    if (err) {
      return res.status(400).send("Error uploading file.");
    }
    req.fileName = req.file.filename;
    next();
  });
};

const reupload = async (req, res) => {
  {/*const id = req.params.id; // this is not _id, this is paperId (filename)
  try {
    const filePath = path.join(__dirname, "/uploads", id);
    await fs.unlink(filePath);
    fileUploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).send("Error reuploading file.");
      }

      // Your file has been reuploaded, and the new filename is available in req.fileName.
      res.status(200).send("File deleted and reuploaded");
    });
  } catch (error) {
    console.error("Error deleting file:", error);

    if (error.code === "ENOENT") {
      res.status(404).send("File not found");
    } else {
      res.status(500).send("Internal Server Error");
    }
  }*/}

  const fileName = req.fileName;
  const paperId = req.params.id;

  if (!fileName) {
    return res.status(400).send("File name is missing in the request.");
  }

  const paper = await Paper.findById(paperId);
  if (!paper) {
    return res.status(404).send("Paper not found");
  }
  paper.updateOne({ paperId: fileName }).exec();
  paper.uploadLink.push(fileName);
  paper.version += 1;
  const newPaper = await paper.save();
  res.status(200).send(newPaper);
};

module.exports = reupload;

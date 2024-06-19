const path = require("path");
const HttpException = require("../../../models/conferenceModule/http-exception.js");

class UploadController {
  // POST /upload/:conferencename
  async uploadFile(req, res) {
    const { conferencename } = req.params;
    if (!req.file) {
      throw new HttpException(400, "No file uploaded");
    }
    const filePath = path.join("/public/temp", req.file.filename);

    // Here you can save the file information to the database if necessary
    res.json({ message: "File uploaded successfully", filePath });
  }
}

module.exports = UploadController;

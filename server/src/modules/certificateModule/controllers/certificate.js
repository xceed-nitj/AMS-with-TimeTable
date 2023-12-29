const HttpException = require("../../../models/http-exception");
const certificate = require("../../../models/certificateModule/certificate");

class AddcertificateController {
  async addcertificate(req, res) {
    const newcertificate = req.body;
    try {
      
      const createdcertificate = await certificate.create(newcertificate);
      return createdcertificate;
    } 
    catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }

  async getAllcertificates(req, res) {
    try {
      const certificateList = await certificate.find();
      return certificateList;
    } 
    catch (e) {
      console.error(e);
  
      // Check if 'e' is an object with 'status' and 'message' properties
      const errorMessage = (e && e.status) ? e.message : "Internal server error";
      const statusCode = (e && e.status) ? e.status : 500;
  
      res.status(statusCode).json({ error: errorMessage });
    }
    }

  async getcertificateById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await certificate.findById(id);
      if (!data) throw new HttpException(400, "certificate does not exist");
      return data;
    } 
    catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updatecertificate(id, certificateData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const updatedcertificate=await certificate.findByIdAndUpdate(id, certificateData);
      return updatedcertificate;
    } 
    catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deletecertificateById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await certificate.findByIdAndDelete(id);
    } 
    catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AddcertificateController;
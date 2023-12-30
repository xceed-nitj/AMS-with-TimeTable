const HttpException = require("../../../models/http-exception");
const certificate = require("../../../models/certificateModule/certificate");

class AddcertificateController {
  async addcertificate(req, res) {
    const newCertificate = req.body;
    try {
      const eventId = req.params.id;
  
      // Check if a certificate with the given event ID already exists
      const existingCertificate = await certificate.findOne({
        eventId: eventId,
      });
  
      if (existingCertificate) {
        // If exists, update the existing certificate
        await certificate.updateOne(
          { eventId: eventId },
          {
            $set: {
              logos: newCertificate.logos,
              header: newCertificate.header,
              body: newCertificate.body,
              footer: newCertificate.footer,
              signature: newCertificate.signature,
            },
          }
        );
  
        return res.status(200).json({ message: "Certificate updated successfully" });
      } else {
        // If not exists, create a new certificate
        const createdCertificate = await certificate.create({
          logos: newCertificate.logos,
          header: newCertificate.header,
          body: newCertificate.body,
          footer: newCertificate.footer,
          signature: newCertificate.signature,
          eventId: eventId,
        });
  
        return res
          .status(201)
          .json({ message: "Certificate created successfully", data: createdCertificate });
      }
    } catch (error) {
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
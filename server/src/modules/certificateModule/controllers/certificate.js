const HttpException = require("../../../models/http-exception");
const certificate = require("../../../models/certificateModule/certificate");

class AddcertificateController {
  async addcertificate(eventId,newCertificate) {
    
    try {

      // Check if a certificate with the given event ID already exists
      const existingCertificate = await certificate.findOne({
        eventId: eventId,
      });

      if (existingCertificate) {
        // If exists, update the existing certificate
        const updatedCertificate=await certificate.updateOne(
          { eventId: eventId },
          {
            $set: {
              logos: newCertificate.logos,
              header: newCertificate.header,
              body: newCertificate.body,
              footer: newCertificate.footer,
              signatures: newCertificate.signatures,
            },
          }
        );
        
        return updatedCertificate
       
      } else {
        // If not exists, create a new certificate
        const createdCertificate = await certificate.create({
          logos: newCertificate.logos,
          header: newCertificate.header,
          body: newCertificate.body,
          footer: newCertificate.footer,
          signatures: newCertificate.signatures,
          eventId: eventId,
        });

        return createdCertificate
      }
    } catch (e) {
      throw new HttpException(500,e)
    }
  }

  async getAllcertificates() {
    try {
      const certificateList = await certificate.find();
      return certificateList;
    } catch (e) {
      throw new HttpException(500,e)
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
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
  async getcertificateByEventId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await certificate.find({ eventId: id });
      if (!data) throw new HttpException(400, "certificate does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updatecertificate(id, certificateData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const updatedcertificate = await certificate.findByIdAndUpdate(
        id,
        certificateData
      );
      return updatedcertificate;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deletecertificateById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await certificate.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AddcertificateController;

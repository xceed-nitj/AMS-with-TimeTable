const HttpException = require("../../../models/http-exception");
const certificate = require("../../../models/certificateModule/certificate");

class AddcertificateController {
  async addcertificate(data) {
    try {
      await certificate.create(data);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getAllcertificates() {
    try {
      const certificateList = await certificate.find();
      return certificateList;
    } catch (e) {
      throw new HttpException(500, e);
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
      throw new HttpException(500, e);
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
      throw new HttpException(500, e);
    }
  }

  async deletecertificateById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await certificate.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }
}

module.exports = AddcertificateController;

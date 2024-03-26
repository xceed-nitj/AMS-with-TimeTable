const SponsorshipRate = require("../../../models/conferenceModule/sponsorshipRates");
const HttpException = require("../../../models/conferenceModule/http-exception");

class SponsorshipRateController {
  async addSponsorshipRate(sponsorshipRate) {
    
    try {
      // Create a new sponsorshipRate document using the Mongoose model
      const newSponsorshipRate = new SponsorshipRate(sponsorshipRate);
      await newSponsorshipRate.save();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");

    }
  }

  async getSponsorshipRateById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an SponsorshipRate document by its _id using the Mongoose model
      const data = await SponsorshipRate.findById(id);

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getSponsorshipRateByConfId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find SponsorshipRate documents with a specific confId using the Mongoose model

      const data = await SponsorshipRate.find({ confId: id });

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAllSponsorshipRates() {
    try {
      // Find all SponsorshipRate documents using the Mongoose model
      return await SponsorshipRate.find();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateSponsorshipRate(id, sponsorshipRate) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    
    try {
      // Update an SponsorshipRate document by its _id using the Mongoose model
      console.log(id , sponsorshipRate);
      const newup = await SponsorshipRate.findByIdAndUpdate({_id:id}, sponsorshipRate,{  
        new: true
    });
      console.log(newup);
      if (!newup) {
        throw new HttpException(404, "sponsorshipRate not found");
      }
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");   
    }
  }

  async deleteSponsorshipRate(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an SponsorshipRate document by its _id using the Mongoose model
      await SponsorshipRate.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = SponsorshipRateController;


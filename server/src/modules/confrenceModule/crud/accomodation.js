const Accomodation = require("../../../models/conferenceModule/accomodation");
const HttpException = require("../../../models/conferenceModule/http-exception");

class AccomodationController {
  async addAccomodation(accomodation) {
    
    try {
      // Create a new accomodation document using the Mongoose model
      const newAccomodation = new Accomodation(accomodation);
      await newAccomodation.save();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");

    }
  }

  async getAccomodationById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an Accomodation document by its _id using the Mongoose model
      const data = await Accomodation.findById(id);

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAccomodationByConfId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find Accomodation documents with a specific confId using the Mongoose model

      const data = await Accomodation.find({ confId: id });

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAllAccomodations() {
    try {
      // Find all Accomodation documents using the Mongoose model
      return await Accomodation.find();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateAccomodation(id, accomodation) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    
    try {
      // Update an Accomodation document by its _id using the Mongoose model
      console.log(id , accomodation);
      const newup = await Accomodation.findByIdAndUpdate({_id:id}, accomodation,{  
        new: true
    });
      console.log(newup);
      if (!newup) {
        throw new HttpException(404, "accomodation not found");
      }
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");   
    }
  }

  async deleteAccomodation(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an Accomodation document by its _id using the Mongoose model
      await Accomodation.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AccomodationController;
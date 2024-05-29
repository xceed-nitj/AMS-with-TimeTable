const Souvenir = require("../../../models/conferenceModule/souvenir");
const HttpException = require("../../../models/conferenceModule/http-exception");

class SouvenirController {
  async addSouvenir(souvenir) {
    
    try {
      // Create a new souvenir document using the Mongoose model
      const newSouvenir = new Souvenir(souvenir);
      await newSouvenir.save();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");

    }
  }

  async getSouvenirById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an Souvenir document by its _id using the Mongoose model
      const data = await Souvenir.findById(id);

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getSouvenirByConfId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find Souvenir documents with a specific confId using the Mongoose model

      const data = await Souvenir.find({ confId: id });

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAllSouvenirs() {
    try {
      // Find all Souvenir documents using the Mongoose model
      return await Souvenir.find();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateSouvenir(id, souvenir) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    
    try {
      // Update an Souvenir document by its _id using the Mongoose model
      console.log(id , souvenir);
      const newup = await Souvenir.findByIdAndUpdate({_id:id}, souvenir,{  
        new: true
    });
      console.log(newup);
      if (!newup) {
        throw new HttpException(404, "souvenir not found");
      }
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");   
    }
  }

  async deleteSouvenir(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an Souvenir document by its _id using the Mongoose model
      await Souvenir.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = SouvenirController;


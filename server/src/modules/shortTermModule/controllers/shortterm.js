const HttpException = require("../../../models/http-exception");
const ShortTerm = require('../../../models/shortTermModule/shortterm'); 

class ShortTermController {
  async createShortTerm(data) {
    try {
      await ShortTerm.create(data);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getAllShortTerms() {
    try {
      const shortTermList = await ShortTerm.find();
      return shortTermList;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getShortTermById(id) {
    if (!id) {
      throw new HttpException(400, "Id not provided");
    }
    try {
      const data = await ShortTerm.findById(id);
      if (!data) throw new HttpException(400, "ShortTerm does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async updateShortTermById(id, shortTermData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await ShortTerm.findByIdAndUpdate(id, shortTermData);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async deleteShortTermById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await ShortTerm.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }


}

module.exports = ShortTermController;

const Conf = require("../../../models/conferenceModule/confrence");
const HttpException = require("../../../models/conferenceModule/http-exception");
const mongoose = require("mongoose");

class ConfController {
  async addConf(conf) {
    // if (!isValidConfrence(conf)) {
    //   return res.status(400).json({ error: "Invalid confrence data" });
    // }
    if (!conf.email || !conf.email.includes("@")) {
      throw new HttpException(400, "Invalid Email");
    }

    try {
      // Create a new Conf document using the Mongoose model
      conf._id = new mongoose.Types.ObjectId();  
      const createdConf = new Conf(conf);
      createdConf.save();
      // const createdConf = await Conf.create(conf);
      return createdConf;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getConfById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Find a Conf document by its _id using the Mongoose model
      const conf = await Conf.findById(id);

      if (!conf) throw new HttpException(400, "data does not exists");

      return conf;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getConf() {
    try {
      // Find all Conf documents using the Mongoose model
      const confs = await Conf.find();
      return confs;
    } catch (e) {
      throw aHttpExcepction(500, e.message || "Internal Server Error");
    }
  }

  async updateConf(conf, id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
  
    if (!conf.email || !conf.email.includes("@")) {
      throw new HttpException(400, "Invalid Email");
    }

    try {
      // Update a Conf document by its _id using the Mongoose model
      const updatedConf = await Conf.findByIdAndUpdate(id, conf, { new: true });
      return updatedConf;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteConf(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Delete a Conf document by its _id using the Mongoose model
      const deletedConf = await Conf.findByIdAndDelete(id);
      return deletedConf;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = ConfController;

function isValidConfrence(confrence) {
  return (
    confrence &&
    typeof confrence === "object" &&
    typeof confrence.id === "string" &&
    typeof confrence.email === "string" &&
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(confrence.email) &&
    (typeof confrence.name === "string" ||
      confrence.name === null ||
      confrence.name === undefined) &&
    confrence.createdAt instanceof Date &&
    confrence.updatedAt instanceof Date &&
    (confrence.Home === null || typeof confrence.Home === "object") &&
    (confrence.Navbar === null || typeof confrence.Navbar === "object") &&
    (Array.isArray(confrence.Participant) ||
      confrence.Participant === undefined) &&
    (Array.isArray(confrence.EventDates) ||
      confrence.EventDates === undefined) &&
    (Array.isArray(confrence.Annoucement) ||
      confrence.Annoucement === undefined) &&
    (Array.isArray(confrence.Images) || confrence.Images === undefined) &&
    (Array.isArray(confrence.Sponsors) || confrence.Sponsors === undefined) &&
    (Array.isArray(confrence.Awards) || confrence.Awards === undefined) &&
    (Array.isArray(confrence.Speakers) || confrence.Speakers === undefined) &&
    (Array.isArray(confrence.Committees) ||
      confrence.Committees === undefined) &&
    (Array.isArray(confrence.Contact) || confrence.Contact === undefined) &&
    (confrence.Location === null || typeof confrence.Location === "object")
  );
}

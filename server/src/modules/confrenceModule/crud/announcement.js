const Announcement = require("../../../models/conferenceModule/announcements");
const HttpException = require("../../../models/conferenceModule/http-exception");

class AnnouncementController {
  async addAnnouncement(announcement) {
    // if (!isValidAnnouncement(announcement)) {
    //   return res.status(400).json({ error: "Invalid Announcement data" });
    // }
    try {
      // Create a new Announcement document using the Mongoose model
      const newAnnouncement = new Announcement(announcement);
      await newAnnouncement.save();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");

    }
  }

  async getAnnouncementById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an Announcement document by its _id using the Mongoose model
      const data = await Announcement.findById(id);

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAnnouncementByConfId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find Announcement documents with a specific confId using the Mongoose model

      const data = await Announcement.find({ confId: id });

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAllAnnouncements() {
    try {
      // Find all Announcement documents using the Mongoose model
      return await Announcement.find();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateAnnouncement(id, announcement) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    
    try {
      // Update an Announcement document by its _id using the Mongoose model
      console.log(id , announcement);
      const newup = await Announcement.findByIdAndUpdate({_id:id}, announcement,{  
        new: true
    });
      console.log(newup);
      if (!newup) {
        throw new HttpException(404, "announcement not found");
      }
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");   
    }
  }

  async deleteAnnouncement(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an Announcement document by its _id using the Mongoose model
      await Announcement.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AnnouncementController;

function isValidAnnouncement(announcement) {
  return (
    announcement &&
    typeof announcement === "object" &&
    typeof announcement.id === "string" &&
    typeof announcement.confId === "string" &&
    typeof announcement.title === "string" &&
    (typeof announcement.metaDescription === "string" ||
      announcement.metaDescription === null ||
      announcement.metaDescription === undefined) &&
    typeof announcement.description === "string" &&
    typeof announcement.feature === "boolean" &&
    typeof announcement.sequence === "number" &&
    typeof announcement.new === "boolean" &&
    typeof announcement.hidden === "boolean" &&
    (typeof announcement.link === "string" ||
      announcement.link === null ||
      announcement.link === undefined) &&
    announcement.createdAt instanceof Date &&
    announcement.updatedAt instanceof Date
  );
}

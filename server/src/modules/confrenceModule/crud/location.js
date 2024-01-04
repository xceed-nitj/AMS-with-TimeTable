const Location = require("../../../models/conferenceModule/location");
const HttpException = require("../../../models/conferenceModule/http-exception");

class LocationController {
  async getLocation(confId) {
    if (!confId) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find a Location document that matches the confId using the Mongoose model
      const location = await Location.findOne({ confId: confId });
      if (!location) return null;
      return location;
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async addLocation(data) {
    // if (!isValidLocation(data)) {
    //   return res.status(400).json({ error: "Invalid Location data" });
    // }
    try {
      // Create a new Location document using the Mongoose model
      const newLocation = Location(data);
      newLocation.save();
      return newLocation;
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async updateLocation(id, data) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
   
    try {
      // Update a Location document by its _id using the Mongoose model
      return await Location.findByIdAndUpdate(id, data, {new:true});
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async deleteLocation(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete a Location document by its _id using the Mongoose model
      return await Location.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = LocationController;
function isValidLocation(location) {
  return (
    location &&
    typeof location === "object" &&
    typeof location.id === "string" &&
    typeof location.confId === "string" &&
    typeof location.description === "string" &&
    typeof location.address === "string" &&
    typeof location.latitude === "string" &&
    typeof location.longitude === "string" &&
    typeof location.feature === "boolean" &&
    typeof location.sequence === "number" &&
    location.createdAt instanceof Date &&
    location.updatedAt instanceof Date
  );
}

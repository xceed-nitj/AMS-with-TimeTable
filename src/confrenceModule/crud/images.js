const Image = require("../models/images");
const HttpException = require("../models/http-exception");

class ImagesController {
  async addImage(image) {
    // if(!isValidImages(image)) {
    //     return res.status(400).json({ error: 'Invalid Image data' });
    //   }
    try {
      // Create a new Image document using the Mongoose model
      await Image.create(image);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getImagesByConfId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Find Image documents that match the confId using the Mongoose model

      const image = await Image.find({ confId: id });

      if (!image) throw new HttpException(400, "data does not exists");
      return image;
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async updateImage(id, image) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    if (!isValidImages(image)) {
      return res.status(400).json({ error: "Invalid Image data" });
    }
    try {
      // Update an Image document by its _id using the Mongoose model
      await Image.findByIdAndUpdate(id, image);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async deleteImage(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Delete an Image document by its _id using the Mongoose model
      await Image.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = ImagesController;
function isValidImages(images) {
  return (
    images &&
    typeof images === "object" &&
    typeof images.id === "string" &&
    typeof images.confId === "string" &&
    (typeof images.name === "string" ||
      images.name === null ||
      images.name === undefined) &&
    typeof images.imgLink === "string" &&
    typeof images.feature === "boolean" &&
    typeof images.sequence === "number" &&
    images.createdAt instanceof Date &&
    images.updatedAt instanceof Date
  );
}

const Image = require("../../../models/conferenceModule/images"); // Change to the appropriate images model
const HttpException = require("../../../models/conferenceModule/http-exception");

class ImagesController {
  // GET /images/conference/:id
  async getImagesByConferenceId(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const images = await Image.find({ confId: id });
      res.json(images);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /images
  async getAllImages(req, res) {
    try {
      const images = await Image.find();
      res.json(images);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /images/:id
  async getImageById(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const image = await Image.findById(id);
      if (image) {
        res.json(image);
      } else {
        res.status(404).json({ error: "Image not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // POST /images
  async createImage(req, res) {
    const newImage = req.body;
    // if(!isValidImages(newImage)) {
    //     return res.status(400).json({ error: 'Invalid image data' });
    //   }
    try {
      const createdImage = await Image.create(newImage);
      res.json(createdImage);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // PUT /images/:id
  async updateImage(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedImage = req.body;
    // if(!isValidImages(updatedImage)) {
    //     return res.status(400).json({ error: 'Invalid image data' });
    //   }
    try {
      const image = await Image.findByIdAndUpdate(id, updatedImage, {
        new: true,
      });
      if (image) {
        res.json(image);
      } else {
        res.status(404).json({ error: "Image not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // DELETE /images/:id
  async deleteImage(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const image = await Image.findByIdAndRemove(id);
      if (image) {
        res.json(image);
      } else {
        res.status(404).json({ error: "Image not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
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

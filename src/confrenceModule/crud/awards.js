const Awards = require("../models/awards");
const HttpException = require("../models/http-exception");

class AwardsController {
  // GET /awards/conference/:id
  async getAwardsByConferenceId(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find awards with a specific confId using the Mongoose model
      const awards = await Awards.find({ confId: id });
      res.json(awards);
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // GET /awards
  async getAllAwards(req, res) {
    try {
      // Find all awards using the Mongoose model
      const awards = await Awards.find();
      console.log(awards);
      return awards;
      //res.json(awards);
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // GET /awards/:id
  async getAwardById(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an award by its _id using the Mongoose model
      const award = await Awards.findById(id);
      if (award) {
        res.json(award);
      } else {
        res.status(404).json({ error: "Award not found" });
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // POST /awards
  async createAward(req, res) {
    const newAward = req.body;

    // if (!isValidAward(newAward)) {
    //   return res.status(400).json({ error: "Invalid award data" });
    // }
    try {
      // Create a new award document using the Mongoose model
      const createdAward = await Awards.create(newAward);
      res.json(createdAward);
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // PUT /awards/:id
  async updateAward(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedAward = req.body;
    if (!isValidAward(updatedAward)) {
      return res.status(400).json({ error: "Invalid award data" });
    }
    try {
      // Update an award by its _id using the Mongoose model
      const award = await Awards.findByIdAndUpdate(id, updatedAward);
      if (award) {
        res.json(award);
      } else {
        res.status(404).json({ error: "Award not found" });
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // DELETE /awards/:id
  async deleteAward(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an award by its _id using the Mongoose model
      const award = await Awards.findByIdAndDelete(id);
      if (award) {
        res.json(award);
      } else {
        res.status(404).json({ error: "Award not found" });
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }
}

module.exports = AwardsController;

function isValidAward(award) {
  return (
    award &&
    typeof award === "object" &&
    typeof award.id === "string" &&
    typeof award.confId === "string" &&
    typeof award.title1 === "string" &&
    (typeof award.title2 === "string" ||
      award.title2 === null ||
      award.title2 === undefined) &&
    (typeof award.description === "string" ||
      award.description === null ||
      award.description === undefined) &&
    typeof award.sequence === "number" &&
    typeof award.featured === "boolean" &&
    typeof award.new === "boolean" &&
    typeof award.hidden === "boolean" &&
    (typeof award.link === "string" ||
      award.link === null ||
      award.link === undefined) &&
    award.createdAt instanceof Date &&
    award.updatedAt instanceof Date
  );
}

const Award = require("../../../models/conferenceModule/awards"); // Change to the appropriate awards model
const HttpException = require("../../../models/conferenceModule/http-exception");

class AwardsController {
  // GET /awards/conference/:id
  async getAwardsByConferenceId(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const awards = await Award.find({ confId: id });
      res.json(awards);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /awards
  async getAllAwards(req, res) {
    try {
      const awards = await Award.find();
      res.json(awards);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /awards/:id
  async getAwardById(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const award = await Award.findById(id);
      if (award) {
        res.json(award);
      } else {
        res.status(404).json({ error: "Award not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // POST /awards
  async createAward(req, res) {
    const newAward = req.body;
    // if(!isValidAwards(newAward)) {
    //     return res.status(400).json({ error: 'Invalid award data' });
    //   }
    try {
      const createdAward = await Award.create(newAward);
      res.json(createdAward);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // PUT /awards/:id
  async updateAward(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedAward = req.body;
    // if(!isValidAwards(updatedAward)) {
    //     return res.status(400).json({ error: 'Invalid award data' });
    //   }
    try {
      const award = await Award.findByIdAndUpdate(id, updatedAward, {
        new: true,
      });
      if (award) {
        res.json(award);
      } else {
        res.status(404).json({ error: "Award not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // DELETE /awards/:id
  async deleteAward(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const award = await Award.findByIdAndRemove(id);
      if (award) {
        res.json(award);
      } else {
        res.status(404).json({ error: "Award not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
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

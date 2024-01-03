const Participant = require("../../../models/conferenceModule/participants");
const HttpException = require("../../../models/conferenceModule/http-exception");

class ParticipantController {
  async addParticipant(participant) {
    // if(!isValidParticipant(participant)) {
    //     return res.status(400).json({ error: 'Invalid participant data' });
    //   }
    try {
      // Create a new Participant document using the Mongoose model
      return await Participant.create(participant);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getParticipantById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Find a Participant document by _id using the Mongoose model
      const participant = await Participant.findById(id);
      if (!participant) throw new HttpException(400, "data does not exists");
      return participant;
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getParticipant() {
    try {
      // Find all Participant documents using the Mongoose model
      return await Participant.find();
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getParticipantByConfId(id) {
    try {
      // Find Participant documents that match the confId using the Mongoose model
      return await Participant.find({ confId: id });
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async updateParticipant(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedParticipant = req.body;
    // if(!isValidSpeakers(updatedSpeaker)) {
    //     return res.status(400).json({ error: 'Invalid speaker data' });
    //   }
    try {
      const participant = await Participant.findByIdAndUpdate(id, updatedParticipant, {
        new: true,
      });
      if (participant) {
        res.json(participant);
      } else {
        res.status(404).json({ error: "participant not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  async deleteParticipant(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Delete a Participant document by _id using the Mongoose model
      return await Participant.findByIdAndRemove(id);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = ParticipantController;
function isValidParticipant(participant) {
  return (
    participant &&
    typeof participant === "object" &&
    typeof participant.id === "string" &&
    typeof participant.confId === "string" &&
    typeof participant.authorName === "string" &&
    typeof participant.authorDesignation === "string" &&
    typeof participant.authorInstitute === "string" &&
    typeof participant.paperTitle === "string" &&
    typeof participant.paperId === "string" &&
    participant.createdAt instanceof Date &&
    participant.updatedAt instanceof Date
  );
}

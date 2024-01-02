const Participant = require("../../../models/conferenceModule/participant");
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
      const Participant = await Participant.findById(id);
      if (!Participant) throw new HttpException(400, "data does not exists");
      return Participant;
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

  async updateParticipant(participant, id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    if (!isValidParticipant(participant)) {
      return res.status(400).json({ error: "Invalid participant data" });
    }
    try {
      // Update a Participant document by _id using the Mongoose model
      return await Participant.findByIdAndUpdate(id, participant);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
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

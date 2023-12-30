const HttpException = require("../../../models/http-exception");
const participant = require("../../../models/certificateModule/participant");

class AddparticipantController {
  async addparticipant(data) {
    try {
      await participant.insertMany(data);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getAllparticipants(eventId) {
    try {
      const participantList = await participant.find({ eventId });
      return participantList;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getparticipantById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await participant.findById(id);
      if (!data) throw new HttpException(400, "participant does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async updateparticipant(id, participantData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const updatedparticipant = await participant.findByIdAndUpdate(
        id,
        participantData
      );
      return updatedparticipant;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async deleteparticipantById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await participant.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AddparticipantController;

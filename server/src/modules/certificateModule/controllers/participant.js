const HttpException = require("../../../models/http-exception");
const participant = require("../../../models/certificateModule/participant");

class AddparticipantController {
  async addparticipant(req, res) {
    const newparticipant = req.body;
  try {
    const eventId = req.params.eventId;
    // Check if a certificate with the given event ID already exists
    const existingParticipant = await participant.findOne({
      eventId: eventId,
    });

    if (existingParticipant) {
      // If exists, update the existing certificate
      await participant.updateOne(
        { eventId: eventId },
        {
          $set: {
            name: newparticipant.name,
            department: newparticipant.department,
            college: newparticipant.college,
            type: newparticipant.type,
            position: newparticipant.position,
            title1:newparticipant.title1,
            title2:newparticipant.title2,           
          },
        }
      );

      return res.status(200).json({ message: "Participant updated successfully" });
    } else {
      // If not exists, create a new certificate
      const createdCertificate = await participant.create({
        name: newparticipant.name,
        department: newparticipant.department,
        college: newparticipant.college,
        types: newparticipant.types,
        position: newparticipant.position,
        title1:newparticipant.title1,
        title2:newparticipant.title2,           
        eventId: eventId,
      });

      return res.status(201).json({ message: "Participant created successfully", data: createdCertificate });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}



  async getAllparticipants(req, res) {
    try {
      const eventId= req.params.eventId;
      const participantList = await participant.find({eventId:eventId});
      return participantList;
    } 
    catch (e) {
      console.error(e);
  
      // Check if 'e' is an object with 'status' and 'message' properties
      const errorMessage = (e && e.status) ? e.message : "Internal server error";
      const statusCode = (e && e.status) ? e.status : 500;
  
      res.status(statusCode).json({ error: errorMessage });
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
    } 
    catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateparticipant(id, participantData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const updatedparticipant=await participant.findByIdAndUpdate(id, participantData);
      return updatedparticipant;
    } 
    catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteparticipantById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await participant.findByIdAndDelete(id);
    } 
    catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = AddparticipantController;
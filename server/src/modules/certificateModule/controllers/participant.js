const HttpException = require("../../../models/http-exception");
const participant = require("../../../models/certificateModule/participant");
const addEvent = require("../../../models/certificateModule/addevent");
const csv = require("csv-parser");
const { Readable } = require("stream");

class AddparticipantController {
  async addBatchparticipant(fileBuffer, eventId) {
    try {
      if (!eventId) throw new HttpException(400, "Event Id is missing");

      // Read the CSV file using csv-parser
      const csvData = [];

      const bufferStream = Readable.from([fileBuffer]);

      bufferStream
        .pipe(csv())
        .on("data", (row) => {
          // Process each row of the CSV and add it to the array
          csvData.push({ ...row, eventId: eventId });
        })
        .on("end", async () => {
          await participant.insertMany(csvData);
        })
        .on("error", (error) => {
          // Handle errors during the CSV file reading process
          console.error("Error reading CSV file:", error.message);
        });
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async addparticipant(newparticipant, eventId) {

    try {
      // If not exists, create a new certificate
      const createdCertificate = await participant.create({
        name: newparticipant.name,
        department: newparticipant.department,
        college: newparticipant.college,
        types: newparticipant.types,
        position: newparticipant.position,
        title1: newparticipant.title1,
        title2: newparticipant.title2,
        mailId: newparticipant.mailId,
        certiType: newparticipant.certiType,
        eventId: eventId,
        isCertificateSent: false,
      });

      return createdCertificate;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getAllparticipants(eventId) {
    try {
      if (!eventId) throw new HttpException(400, "Event Id not provided");
      const participantList = await participant.find({ eventId: eventId });
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
      const pt = await participant.findById(id,{ cache: false });
      const updatedparticipant = await participant.findByIdAndUpdate(
        id,
        participantData,
        { new:true } // return the updated document
      );

      if (updatedparticipant.isCertificateSent) {
        const event = await addEvent.findById(pt.eventId, { cache: false });
        console.log(event);
        const certificateIssued = await participant.countDocuments({
          $and: [
            { eventId: pt.eventId },
            { isCertificateSent: true },
          ],
        })
        console.log(certificateIssued)
        event.certificateIssued = certificateIssued
        await event.save()
      }



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

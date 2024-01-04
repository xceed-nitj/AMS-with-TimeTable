const { Request, Response } = require("express");
const EventDate = require("../../../models/conferenceModule/EventDate");
const HttpException = require("../../../models/conferenceModule/http-exception");

class EventDateController {
  // GET /eventDates/conference/:id
  async getEventDatesByConferenceId(id) {
    
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find all EventDate documents that match the confId using the Mongoose model
      const eventDates = await EventDate.find({ confId: id });

      if (!eventDates) throw new HttpException(400, "data does not exists");
      return eventDates;
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // GET /eventDates
  async getAllEventDates(req, res) {
    try {
      // Find all EventDate documents using the Mongoose model
      const eventDates = await EventDate.find();
      console.log("eventdates:",eventDates);
      return eventDates;
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // GET /eventDates/:id
  async getEventDateById(id) {
    ;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an EventDate document by its _id using the Mongoose model
      const eventDate = await EventDate.findById(id);
      if (eventDate) {
       return eventDate
      } else {
        throw new HttpException(404, "event date not found");
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // POST /eventDates
  async createEventDate(data) {
    
    // if(!isValidEventDates(newEventDate)) {
    //     return res.status(400).json({ error: 'Invalid Event date' });
    //   }
    try {
      // Create a new EventDate document using the Mongoose model
      const createdEventDate = EventDate(data);
      createdEventDate.save();
      return createdEventDate;
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // PUT /eventDates/:id
  async updateEventDate(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedEventDate = req.body;
    // if(!isValidSpeakers(updatedSpeaker)) {
    //     return res.status(400).json({ error: 'Invalid speaker data' });
    //   }
    try {
      const eventDate = await EventDate.findByIdAndUpdate(id, updatedEventDate, {
        new: true,
      });
      if (eventDate) {
        res.json(eventDate);
      } else {
        res.status(404).json({ error: "EventDate not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // DELETE /eventDates/:id
  async deleteEventDate(id) {
    
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an EventDate document by its _id using the Mongoose model
      const deletedEventDate = await EventDate.findByIdAndDelete(id);
      if (!deletedEventDate) {
        throw new HttpException(404, "event date not found");
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }
}

module.exports = EventDateController;
function isValidEventDates(eventDates) {
  return (
    eventDates &&
    typeof eventDates === "object" &&
    typeof eventDates.id === "string" &&
    typeof eventDates.confId === "string" &&
    (typeof eventDates.title === "string" ||
      eventDates.title === null ||
      eventDates.title === undefined) &&
    eventDates.date instanceof Date &&
    typeof eventDates.sequence === "number" &&
    typeof eventDates.extended === "boolean" &&
    (eventDates.newDate instanceof Date ||
      eventDates.newDate === null ||
      eventDates.newDate === undefined) &&
    typeof eventDates.completed === "boolean" &&
    typeof eventDates.featured === "boolean" &&
    eventDates.createdAt instanceof Date &&
    eventDates.updatedAt instanceof Date
  );
}

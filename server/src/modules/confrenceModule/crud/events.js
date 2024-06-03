const Event = require("../../../models/conferenceModule/event");
const HttpException = require("../../../models/conferenceModule/http-exception");

class EventController {
  async addEvent(event) {
    
    try {
      // Create a new event document using the Mongoose model
      const newEvent = new Event(event);
      await newEvent.save();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");

    }
  }

  async getEventById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find an Event document by its _id using the Mongoose model
      const data = await Event.findById(id);

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getEventByConfId(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find Event documents with a specific confId using the Mongoose model

      const data = await Event.find({ confId: id });

      if (!data) throw new HttpException(400, "data does not exists");

      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getAllEvents() {
    try {
      // Find all Event documents using the Mongoose model
      return await Event.find();
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateEvent(id, event) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    
    try {
      // Update an Event document by its _id using the Mongoose model
      console.log(id , event);
      const newup = await Event.findByIdAndUpdate({_id:id}, event,{  
        new: true
    });
      console.log(newup);
      if (!newup) {
        throw new HttpException(404, "event not found");
      }
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");   
    }
  }

  async deleteEvent(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete an Event document by its _id using the Mongoose model
      await Event.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = EventController;


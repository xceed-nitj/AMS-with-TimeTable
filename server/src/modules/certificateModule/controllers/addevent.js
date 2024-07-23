const HttpException = require("../../../models/http-exception");
const addEvent = require("../../../models/certificateModule/addevent");
const User = require("../../../models/usermanagement/user"); 

class AddEventController {
  async addEvent(data) {
    try {
      await addEvent.create(data);

      const userId = data.user;
      // console.log("User ID:", userId);
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          // Check if user has 'CM' role
          if (!user.role.includes('CM')) {
            user.role.push('CM'); 
            await user.save(); 
          }
        } else {
          throw new HttpException(404, "User not found");
        }
      } else {
        throw new HttpException(400, "User ID not provided");
      }
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async assignEventToUser(data, userId) {
    try {
      const newEvent = await addEvent.create({ ...data, user: userId });

      const user = await User.findById(userId);
      if (user) {
        if (!user.role.includes('CM')) {
          user.role.push('CM');
          await user.save();
        }
      } else {
        throw new HttpException(404, "User not found");
      }

      return newEvent;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async lockEvent(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await addEvent.findByIdAndUpdate(id, {lock:true});
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async unlockEvent(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await addEvent.findByIdAndUpdate(id, {lock:false});
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getAllEvents() {
    try {
      const eventList = await addEvent.find();
      return eventList;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getEventById(id) {
    if (!id) {
      throw new HttpException(400, "Id not provided");
    }
    try {
      const data = await addEvent.findById(id);
      if (!data) throw new HttpException(400, "Event does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async updateEvent(id, eventData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await addEvent.findByIdAndUpdate(id, eventData);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async deleteEventById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await addEvent.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e);
    }
  }

  async getEventByUser(user) {
    if (!user) {
      throw new HttpException(400, "Invalid User");
    }
    try {
      const data = await addEvent.find({ user: user });
      if (!data) throw new HttpException(400, "Event does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e);
    }
  }




}

module.exports = AddEventController;

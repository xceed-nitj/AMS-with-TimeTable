// const HttpException = require("../../../models/http-exception");
// const addEvent = require("../../../models/certificateModule/addevent");
// const User = require("../../../models/usermanagement/user"); 

// class AddEventController {
//   async addEvent(data) {
//     try {
//       await addEvent.create(data);

//       const userId = data.user;
//       // console.log("User ID:", userId);
//       if (userId) {
//         const user = await User.findById(userId);
//         if (user) {
//           // Check if user has 'CM' role
//           if (!user.role.includes('CM')) {
//             user.role.push('CM'); 
//             await user.save(); 
//           }
//         } else {
//           throw new HttpException(404, "User not found");
//         }
//       } else {
//         throw new HttpException(400, "User ID not provided");
//       }
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async assignEventToUser(data, userId) {
//     try {
//       const newEvent = await addEvent.create({ ...data, user: userId });

//       const user = await User.findById(userId);
//       if (user) {
//         if (!user.role.includes('CM')) {
//           user.role.push('CM');
//           await user.save();
//         }
//       } else {
//         throw new HttpException(404, "User not found");
//       }

//       return newEvent;
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async lockEvent(id) {
//     if (!id) {
//       throw new HttpException(400, "Invalid Id");
//     }
//     try {
//       await addEvent.findByIdAndUpdate(id, {lock:true});
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async unlockEvent(id) {
//     if (!id) {
//       throw new HttpException(400, "Invalid Id");
//     }
//     try {
//       await addEvent.findByIdAndUpdate(id, {lock:false});
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async getAllEvents() {
//     try {
//       const eventList = await addEvent.find();
//       return eventList;
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async getEventById(id) {
//     if (!id) {
//       throw new HttpException(400, "Id not provided");
//     }
//     try {
//       const data = await addEvent.findById(id);
//       if (!data) throw new HttpException(400, "Event does not exist");
//       return data;
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async updateEvent(id, eventData) {
//     if (!id) {
//       throw new HttpException(400, "Invalid Id");
//     }
//     try {
//       await addEvent.findByIdAndUpdate(id, eventData);
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async deleteEventById(id) {
//     if (!id) {
//       throw new HttpException(400, "Invalid Id");
//     }
//     try {
//       await addEvent.findByIdAndDelete(id);
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }

//   async getEventByUser(user) {
//     if (!user) {
//       throw new HttpException(400, "Invalid User");
//     }
//     try {
//       const data = await addEvent.find({ user: user });
//       if (!data) throw new HttpException(400, "Event does not exist");
//       return data;
//     } catch (e) {
//       throw new HttpException(500, e);
//     }
//   }




// }

// module.exports = AddEventController;



const HttpException = require("../../../models/http-exception");
const addEvent = require("../../../models/certificateModule/addevent");
const User = require("../../../models/usermanagement/user");

class AddEventController {
  async addEvent(data) {
    try {
      await addEvent.create(data);

      const userId = data.user;
      if (!userId) {
        throw new HttpException(400, "User ID not provided");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new HttpException(404, "User not found");
      }

      if (!user.role.includes("CM")) {
        user.role.push("CM");
        await user.save();
      }
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }

  async assignEventToUser(data, userId) {
    try {
      const newEvent = await addEvent.create({ ...data, user: userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new HttpException(404, "User not found");
      }

      if (!user.role.includes("CM")) {
        user.role.push("CM");
        await user.save();
      }

      return newEvent;
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }

  //  LOCK EVENT 
  async lockEvent(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Event ID");
    }

    const event = await addEvent.findById(id);
    if (!event) {
      throw new HttpException(404, "Event not found");
    }

    if (event.lock === true) {
      throw new HttpException(409, "Event already locked");
    }

    event.lock = true;
    await event.save();
  }

  //  UNLOCK EVENT
  async unlockEvent(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Event ID");
    }

    const event = await addEvent.findById(id);
    if (!event) {
      throw new HttpException(404, "Event not found");
    }

    event.lock = false;
    await event.save();
  }

  async getAllEvents() {
    try {
      return await addEvent.find();
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }

  async getEventById(id) {
    if (!id) {
      throw new HttpException(400, "Id not provided");
    }

    const data = await addEvent.findById(id);
    if (!data) {
      throw new HttpException(404, "Event does not exist");
    }

    return data;
  }

  async updateEvent(id, eventData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      await addEvent.findByIdAndUpdate(id, eventData, {
        new: true,
        runValidators: true,
      });
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }

  async deleteEventById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      await addEvent.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }

  async getEventByUser(user) {
    if (!user) {
      throw new HttpException(400, "Invalid User");
    }

    try {
      return await addEvent.find({ user });
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }

  async getEventByUserWithCertificateCounts(user) {
    if (!user) {
      throw new HttpException(400, "Invalid User");
    }

    try {
      const participant = require("../../../models/certificateModule/participant");
      
      // Get all events for the user
      const events = await addEvent.find({ user });
      
      // Get certificate counts for all events in one query using aggregation
      const certificateCounts = await participant.aggregate([
        {
          $match: {
            eventId: { $in: events.map(e => e._id) }
          }
        },
        {
          $group: {
            _id: "$eventId",
            totalCount: { $sum: 1 },
            issuedCount: {
              $sum: { $cond: ["$isCertificateSent", 1, 0] }
            }
          }
        }
      ]);

      // Create a map for quick lookup
      const countsMap = {};
      certificateCounts.forEach(count => {
        countsMap[count._id.toString()] = {
          totalCertificates: count.totalCount,
          certificatesIssued: count.issuedCount
        };
      });

      // Enrich events with certificate counts
      const enrichedEvents = events.map(event => ({
        ...event.toObject(),
        totalCertificates: countsMap[event._id.toString()]?.totalCertificates || 0,
        certificatesIssued: countsMap[event._id.toString()]?.certificatesIssued || 0
      }));

      return enrichedEvents;
    } catch (e) {
      throw new HttpException(500, e.message || e);
    }
  }
}

module.exports = AddEventController;

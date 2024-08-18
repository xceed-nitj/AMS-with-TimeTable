const Committee = require("../../../models/conferenceModule//committees");
const HttpException = require("../../../models/conferenceModule/http-exception");

class CommitteesController {
  // GET /committees/conference/:id
  async getCommitteesByConferenceId(id) {
    
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find committees with a specific ConfId using the Mongoose model
      const committees = await Committee.find({ confId: id });  
      console.log('comittees',committees);
      if (!committees) throw new HttpException(400, "data does not exists");

      return committees;
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // GET /committees
  async getAllCommittees(req, res) {
    try {
      // Find all committees using the Mongoose model
      const committees = await Committee.find();
      console.log(committees);
      return committees;
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // GET /committees/:id
  async getCommitteeById(id) {
    
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Find a committee by its _id using the Mongoose model
      const committee = await Committee.findById(id);
      if (committee) {
        console.log(committee);
        return committee;
      } else {
        throw new HttpException(404,  "commitee not  found");
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // POST /committees
  async createCommittee(newCommittee) {
    // if(!isValidCommittee(conf)) {
    //     return res.status(400).json({ error: 'Invalid Committee data' });
    // }
    try {
      // Create a new committee document using the Mongoose model
      const createdCommittee = await Committee.create(newCommittee);
      return createdCommittee;
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // PUT /committees/:id
  async updateCommittee(id , updatedCommittee) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
   
    try {
      // Update a committee by its _id using the Mongoose model
      const committee = await Committee.findByIdAndUpdate(id, updatedCommittee, {new:true});
      if (committee) {
        return committee; 
      } else {
        throw new HttpException(404, "Committee not found" ); 
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }

  // DELETE /committees/:id
  async deleteCommittee(id) {
   
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      // Delete a committee by its _id using the Mongoose model
      const committee = await Committee.findByIdAndDelete(id);
      if (committee) {
        return committee
      } else {
        throw new HttpException(404, "Committee not found" ); 
      }
    } catch (error) {
      throw new HttpException(500, error.message || "Internal server error");
    }
  }
}

module.exports = CommitteesController;

// function isValidCommittees(committees) {
//   return (
//     committees &&
//     typeof committees === "object" &&
//     typeof committees.id === "string" &&
//     typeof committees.ConfId === "string" &&
//     typeof committees.Type === "string" &&
//     (typeof committees.Subtype === "string" ||
//       committees.Subtype === null ||
//       committees.Subtype === undefined) &&
//     typeof committees.Name === "string" &&
//     typeof committees.Designation === "string" &&
//     typeof committees.Institute === "string" &&
//     typeof committees.ProfileLink === "string" &&
//     (typeof committees.ImgLink === "string" ||
//       committees.ImgLink === null ||
//       committees.ImgLink === undefined) &&
//     typeof committees.sequence === "number" &&
//     typeof committees.feature === "boolean" &&
//     committees.createdAt instanceof Date &&
//     committees.updatedAt instanceof Date
//   );
// }

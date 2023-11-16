const HttpException = require("../../../models/http-exception");
const CommonLoad = require("../../../models/commonLoad");

const CommonLoaddto = require("../dto/commonload");
const CommonLoadDto = new CommonLoaddto();


const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();

class CommonLoadController {
  async createCommonLoad(req, res) {
    const newCommonLoad = req.body;
    const ttdept = await TimeTableDto.getTTdetailsByCode(req.body.code);
    const checkFaculty=await CommonLoadDto.IsFacultyBelongsToDept(req.body.faculty,ttdept.dept) 
    if(checkFaculty)
    {
    try {
      const createdCommonLoad = await CommonLoad.create(newCommonLoad);
      res.json(createdCommonLoad);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  else
  {
    res.status(200).json({ message: "Faculty dont belong to your department! Contact Admin!" });
  }
  }

  async getAllCommonLoads(req, res) {
    try {
      const commonLoadList = await CommonLoad.find();
      res.json(commonLoadList);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getCommonLoadById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await CommonLoad.findById(id);
      if (!data) throw new HttpException(400, "Data does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async getCommonLoadByCode(code, faculty) {
    try {
      const commonLoads = await CommonLoad.find({ code: code, faculty: faculty });
      return commonLoads;
    } catch (error) {
      throw new Error("Failed to get common loads by code");
    }
  }

  async getCommonLoadBySession(session,faculty) {
    try {
      const timetableEntry = await TimeTable.findOne({ code: code, faculty:faculty });
  
      if (!timetableEntry) {
        throw new Error("Session not found for the provided code");
      }
      const commonLoads = await CommonLoad.find({ session: timetableEntry.session });
      return commonLoads;
    } catch (error) {
      throw new Error("Failed to get common loads by session");
    }
  }
  

  async updateCommonLoad(id, updatedData) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await CommonLoad.findByIdAndUpdate(id, updatedData);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteCommonLoad(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await CommonLoad.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = CommonLoadController;

const Speaker = require("../../../models/conferenceModule/speakers");
const HttpException = require("../../../models/conferenceModule/http-exception");

class SpeakersController {
  // GET /speakers/conference/:id
  async getSpeakersByConferenceId(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const speakers = await Speaker.find({ ConfId: id });
      res.json(speakers);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /speakers
  async getAllSpeakers(req, res) {
    try {
      const speakers = await Speaker.find();
      res.json(speakers);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /speakers/:id
  async getSpeakerById(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const speaker = await Speaker.findById(id);
      if (speaker) {
        res.json(speaker);
      } else {
        res.status(404).json({ error: "Speaker not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // POST /speakers
  async createSpeaker(req, res) {
    const newSpeaker = req.body;
    // if(!isValidSpeakers(newSpeaker)) {
    //     return res.status(400).json({ error: 'Invalid speaker data' });
    //   }
    try {
      const createdSpeaker = await Speaker.create(newSpeaker);
      res.json(createdSpeaker);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // PUT /speakers/:id
  async updateSpeaker(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedSpeaker = req.body;
    // if(!isValidSpeakers(updatedSpeaker)) {
    //     return res.status(400).json({ error: 'Invalid speaker data' });
    //   }
    try {
      const speaker = await Speaker.findByIdAndUpdate(id, updatedSpeaker, {
        new: true,
      });
      if (speaker) {
        res.json(speaker);
      } else {
        res.status(404).json({ error: "Speaker not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // DELETE /speakers/:id
  async deleteSpeaker(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const speaker = await Speaker.findByIdAndRemove(id);
      if (speaker) {
        res.json(speaker);
      } else {
        res.status(404).json({ error: "Speaker not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }
}

module.exports = SpeakersController;

function isValidSpeakers(speakers) {
  return (
    speakers &&
    typeof speakers === "object" &&
    typeof speakers.id === "string" &&
    typeof speakers.ConfId === "string" &&
    typeof speakers.Name === "string" &&
    typeof speakers.Designation === "string" &&
    typeof speakers.Institute === "string" &&
    typeof speakers.ProfileLink === "string" &&
    (typeof speakers.ImgLink === "string" ||
      speakers.ImgLink === null ||
      speakers.ImgLink === undefined) &&
    typeof speakers.TalkType === "string" &&
    typeof speakers.TalkTitle === "string" &&
    (typeof speakers.Abstract === "string" ||
      speakers.Abstract === null ||
      speakers.Abstract === undefined) &&
    (typeof speakers.Bio === "string" ||
      speakers.Bio === null ||
      speakers.Bio === undefined) &&
    typeof speakers.sequence === "number" &&
    typeof speakers.feature === "boolean" &&
    speakers.createdAt instanceof Date &&
    speakers.updatedAt instanceof Date
  );
}

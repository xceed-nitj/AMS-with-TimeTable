const ContactUs = require("../../../models/conferenceModule/contactUs");
const HttpException = require("../../../models/conferenceModule/http-exception");

class ContactUsController {
  // GET /contact-us/conference/:id
  async getContactUsByConferenceId(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const contactUss = await ContactUs.find({ confId: id });
      res.json(contactUss);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /contact-us
  async getAllContactUs(req, res) {
    try {
      const contactUss = await ContactUs.find();
      res.json(contactUss);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /contact-us/:id
  async getContactUsById(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const contactUs = await ContactUs.findById(id);
      if (contactUs) {
        res.json(contactUs);
      } else {
        res.status(404).json({ error: "ContactUs message not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // POST /contact-us
  async createContactUs(req, res) {
    const newContactUs = req.body;
    // if(!isValidContactUs(newContactUs)) {
    //     return res.status(400).json({ error: 'Invalid contact us data' });
    //   }
    try {
      const createdContactUs = await ContactUs.create(newContactUs);
      res.json(createdContactUs);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // PUT /contact-us/:id
  async updateContactUs(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedContactUs = req.body;
    // if(!isValidContactUs(updatedContactUs)) {
    //     return res.status(400).json({ error: 'Invalid contact us data' });
    //   }
    try {
      const contactUs = await ContactUs.findByIdAndUpdate(id, updatedContactUs, {
        new: true,
      });
      if (contactUs) {
        res.json(contactUs);
      } else {
        res.status(404).json({ error: "ContactUs message not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // DELETE /contact-us/:id
  async deleteContactUs(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const contactUs = await ContactUs.findByIdAndRemove(id);
      if (contactUs) {
        res.json(contactUs);
      } else {
        res.status(404).json({ error: "ContactUs message not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }
}

module.exports = ContactUsController;

function isValidContact(contact) {
  return (
    contact &&
    typeof contact === "object" &&
    typeof contact.id === "string" &&
    typeof contact.confId === "string" &&
    typeof contact.title === "string" &&
    typeof contact.name === "string" &&
    typeof contact.designation === "string" &&
    (typeof contact.imgLink === "string" ||
      contact.imgLink === null ||
      contact.imgLink === undefined) &&
    typeof contact.institute === "string" &&
    typeof contact.profileLink === "string" &&
    typeof contact.phone === "string" &&
    typeof contact.email === "string" &&
    (typeof contact.fax === "string" ||
      contact.fax === null ||
      contact.fax === undefined) &&
    typeof contact.feature === "boolean" &&
    typeof contact.sequence === "number" &&
    contact.createdAt instanceof Date &&
    contact.updatedAt instanceof Date
  );
}

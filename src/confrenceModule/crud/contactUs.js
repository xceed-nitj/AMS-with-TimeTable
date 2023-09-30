const ContactUs = require("../models/contactUs");
const HttpException = require("../models/http-exception");

class ContactUsController {
  async getAllContacts(confId) {
    try {
      // Find all contact documents that match the confId using the Mongoose model
      const contacts = await ContactUs.find({ confId });
      return contacts;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async addContact(data) {
    // if(!isValidContact(conf)) {
    //     return res.status(400).json({ error: 'Invalid Contact data' });
    //   }
    try {
      // Create a new ContactUs document using the Mongoose model
      const createdContact = await ContactUs.create(data);
      return createdContact;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateContact(id, data) {
    try {
      if (!id) {
        throw new HttpException(400, "Contact ID is required");
      }
      if (!isValidContact(data)) {
        return res.status(400).json({ error: "Invalid Contact data" });
      }
      // Update a ContactUs document by its _id using the Mongoose model
      const updatedContact = await ContactUs.findByIdAndUpdate(id, data, {
        new: true,
      });
      if (!updatedContact) {
        throw new HttpException(404, "Contact not found");
      }
      return updatedContact;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteContact(id) {
    try {
      if (!id) {
        throw new HttpException(400, "Contact ID is required");
      }
      // Delete a ContactUs document by its _id using the Mongoose model
      const deletedContact = await ContactUs.findByIdAndDelete(id);
      if (!deletedContact) {
        throw new HttpException(404, "Contact not found");
      }
      return deletedContact;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
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

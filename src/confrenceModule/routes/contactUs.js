const express = require("express");
const { Request, Response } = require("express");
const ContactUs = require("../models/contactUs");
const ContactUsController = require("../crud/contactUs");

const router = express.Router();
const contactUsController = new ContactUsController();

router.get("/:confId", async (req, res) => {
  try {
    const { confId } = req.params;
    if (!confId) {
      res.status(400).json({ message: "Conference ID is required" });
      return;
    }
    const contacts = await contactUsController.getAllContacts(confId);
    if (!contacts) {
      res.status(404).json({ message: "No contacts found" });
      return;
    }
    res.status(200).json(contacts);
  } catch (e) {
    res
      .status(500)
      .json({ message: e?.meta?.cause || "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newContact = req.body;
    if (!newContact.confId) {
      res.status(400).json({ message: "Conference ID is required" });
      return;
    }
    const contact = await contactUsController.addContact(newContact);
    res.status(201).json({ message: "Contact added successfully" });
  } catch (e) {
    res
      .status(500)
      .json({ message: e?.meta?.cause || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedContact = req.body;
    if (!updatedContact.confId) {
      res.status(400).json({ message: "Conference ID is required" });
      return;
    }
    const contact = await contactUsController.updateContact(id, updatedContact);
    res.status(200).json(contact);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ message: e?.meta?.cause || "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await contactUsController.deleteContact(id);
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (e) {
    res
      .status(500)
      .json({ message: e?.meta?.cause || "Internal Server Error" });
  }
});

module.exports = router;

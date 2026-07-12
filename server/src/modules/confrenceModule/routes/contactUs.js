const express = require("express");
const ContactUsController = require("../crud/contactUs"); // Change to the appropriate contactUs controller

const contactUsRouter = express.Router();
const contactUsController = new ContactUsController();
const { checkRole } = require("../../checkRole.middleware");

// GET /contact-us/conference/:id
contactUsRouter.get("/conference/:id", checkRole(['EO']), async (req, res) => {
  try {
    await contactUsController.getContactUsByConferenceId(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /contact-us
contactUsRouter.get("/", checkRole(['EO']), async (req, res) => {
  try {
    await contactUsController.getAllContactUs(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /contact-us/:id
contactUsRouter.get("/:id", checkRole(['EO']), async (req, res) => {
  try {
    await contactUsController.getContactUsById(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /contact-us
contactUsRouter.post("/", async (req, res) => {
  try {
    await contactUsController.createContactUs(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /contact-us/:id
contactUsRouter.put("/:id", checkRole(['EO']), async (req, res) => {
  try {
    await contactUsController.updateContactUs(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /contact-us/:id
contactUsRouter.delete("/:id", checkRole(['EO']), async (req, res) => {
  try {
    await contactUsController.deleteContactUs(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = contactUsRouter;

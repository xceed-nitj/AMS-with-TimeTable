const express = require("express");
const Announcement = require("../models/announcements");

const AnnouncementController = require("../crud/announcement");

const announcementController = new AnnouncementController();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const announcements = await announcementController.getAllAnnouncements();
    res.status(200).json(announcements);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await announcementController.getAnnouncementById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.get("/conf/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await announcementController.getAnnouncementByConfId(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newAnnouncement = req.body;
    await announcementController.addAnnouncement(newAnnouncement);
    res.status(201).json({ response: "Announcement created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const announcementId = req.params.id;
    const updatedAnnouncement = req.body;
    await announcementController.updateAnnouncement(
      announcementId,
      updatedAnnouncement
    );
    res.status(200).json({ response: "Announcement updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const announcementId = req.params.id;
    await announcementController.deleteAnnouncement(announcementId);
    res.status(200).json({ response: "Announcement deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Announcement
 *   description: API endpoints for Announcement.
 */

/**
 * @swagger
 * /announcement:
 *  get:
 *    tags: [Announcement]
 *    description: Get all Announcements
 *    responses:
 *      200:
 *        description: Success response
 *        content:
 *          application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Announcement'
 *      500:
 *       description: Internal server error
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Error'
 *  post:
 *    tags: [Announcement]
 *    summary: Create a new Announcement
 *    description: Create a new Announcement
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AnnoucmentModel'
 *    responses:
 *     201:
 *      description: success response
 *      content:
 *          application/json:
 *              schema:
 *                  $ref: '#/components/schemas/Success'
 *     400:
 *      description: Bad Request
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Error'
 *     500:
 *        description: Internal server error
 *        content:
 *            application/json:
 *                schema:
 *                  $ref: '#/components/schemas/Error'
 */

// ... (remaining Swagger documentation)

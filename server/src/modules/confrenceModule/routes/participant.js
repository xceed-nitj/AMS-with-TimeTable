const express = require("express");
const { Router } = express;
const participant = require("../models/participant");
const ParticipantController = require("../crud/participant");

const participantController = new ParticipantController();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const resp = await participantController.getParticipant();
    res.status(200).json(resp);
  } catch (e) {
    console.error("Error participant items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await participantController.getParticipantById(id);
    res.status(200).json(resp);
  } catch (e) {
    console.error("Error participant items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/conf/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await participantController.getParticipantByConfId(id);
    res.status(200).json(resp);
  } catch (e) {
    console.error("Error participant items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const participantData = req.body;
    await participantController.addParticipant(participantData);
    res.status(200).json({ success: "Participant Added Successfully" });
  } catch (e) {
    console.error("Error participant items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const participantData = req.body;
    await participantController.updateParticipant(
      participantData,
      req.params.id
    );
    res.status(200).json({ success: "Participant Updated Successfully" });
  } catch (e) {
    console.error("Error participant items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await participantController.deleteParticipant(req.params.id);
    res.status(200).json({ success: "Participant Deleted Successfully" });
  } catch (e) {
    console.error("Error participant items:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Participant
 *   description: API endpoints for participant
 */

/**
 * @swagger
 * /participant:
 *   get:
 *     tags: [Participant]
 *     description: Get all Participants
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Participant]
 *     summary: Create a new participant
 *     description: Create a new participant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Participant'
 *     responses:
 *       201:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /participant/{id}:
 *   get:
 *     tags: [Participant]
 *     description: Get participant by ID
 *     summary: Get participant by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Participant ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Participant'
 *       400:
 *        description: Bad Request
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 */

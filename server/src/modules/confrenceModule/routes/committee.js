const express = require("express");
const CommitteesController = require("../crud/committees");

const committeesRouter = express.Router();
const committeesController = new CommitteesController();

// GET /committees/conference/:id
committeesRouter.get("/", async (req, res) => {
  try {
    const allConferences = await committeesController.getAllCommittees();
    res.status(200).json(allConferences);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  } 
});

committeesRouter.get("/conference/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const committees = await committeesController.getCommitteesByConferenceId(id);
    res.status(200).json(committees);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// GET /committees
committeesRouter.get("/", async (req, res) => {
  try {
    const allCommittees = await committeesController.getAllCommittees();
    res.status(200).json(allCommittees);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// GET /committees/:id
committeesRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const committee = await committeesController.getCommitteeById(id);
    res.status(200).json(committee);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// POST /committees
committeesRouter.post("/", async (req, res) => {
  try {
    const newCommittee = req.body;
    await committeesController.createCommittee(newCommittee);
    res.status(201).json({ response: "Committee created successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// PUT /committees/:id
committeesRouter.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedCommittee = req.body;
    await committeesController.updateCommittee(id, updatedCommittee);
    res.status(200).json({ response: "Committee updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// DELETE /committees/:id
committeesRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await committeesController.deleteCommittee(id);
    res.status(200).json({ response: "Committee deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = committeesRouter;

/**
 * @swagger
 * tags:
 *   name: Committees
 *   description: API endpoints for Committees
 */

/**
 * @swagger
 * /committees/conference/{id}:
 *   get:
 *     summary: Get committees by conference ID
 *     tags: [Committees]
 *     description: Retrieve committees based on the conference ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Conference ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Committee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /committees:
 *   get:
 *     tags: [Committees]
 *     summary: Get all committees
 *     description: Retrieve all committees
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags: [Committees]
 *     summary: Create a new committee
 *     description: Create a new committee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommitteesModel'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /committees/{id}:
 *   get:
 *     tags: [Committees]
 *     summary: Get a committee by ID
 *     description: Retrieve a committee by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Committee ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Committee not found
 *       500:
 */

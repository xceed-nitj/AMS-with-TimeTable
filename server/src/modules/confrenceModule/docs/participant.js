/**
 * @swagger
 * tags:
 *   name: Participant
 *   description: API endpoints for participant
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Participant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Participant ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         authorName:
 *           type: string
 *           description: Author's Name
 *         authorDesignation:
 *           type: string
 *           description: Author's Designation
 *         authorInstitute:
 *           type: string
 *           description: Author's Institute
 *         paperTitle:
 *           type: string
 *           description: Paper Title
 *         paperId:
 *           type: string
 *           description: Paper ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation Date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last Update Date
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

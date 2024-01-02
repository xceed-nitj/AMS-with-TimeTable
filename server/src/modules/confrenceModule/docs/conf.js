/**
 * @swagger
 * tags:
 *   name: Conference
 *   description: API endpoints for Conference
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Conference:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Conference ID
 *         email:
 *           type: string
 *           description: Conference email
 *         name:
 *           type: string
 *           description: Conference name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Conference creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Conference last update date
 */

/**
 * @swagger
 * /conferences:
 *   get:
 *     tags: [Conference]
 *     summary: Get all conferences
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conference'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 *   post:
 *     tags: [Conference]
 *     summary: Create a new conference
 *     requestBody:
 *       description: Conference object to be added
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Conference'
 *     responses:
 *       201:
 *         description: Conference added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conference'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 * /conferences/{id}:
 *   get:
 *     tags: [Conference]
 *     summary: Get a conference by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Conference ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conference'
 *       404:
 *         description: Conference not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 *   put:
 *     tags: [Conference]
 *     summary: Update a conference by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Conference ID
 *     requestBody:
 *       description: Conference object to be updated
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Conference'
 *     responses:
 *       200:
 *         description: Conference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conference'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       404:
 *         description: Conference not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *
 *   delete:
 *     tags: [Conference]
 *     summary: Delete a conference by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Conference ID
 *     responses:
 *       200:
 *         description: Conference deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conference'
 *       404:
 *         description: Conference not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */

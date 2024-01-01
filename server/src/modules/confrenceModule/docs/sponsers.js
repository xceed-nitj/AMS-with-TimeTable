/**
 * @swagger
 * tags:
 *   name: Sponsors
 *   description: API endpoints for Sponsors
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SponsorsModel:
 *       type: object
 *       properties:
 *         confId:
 *           type: string
 *           description: Conference ID
 *         name:
 *           type: string
 *           description: Sponsor's Name
 *         type:
 *           type: string
 *           description: Sponsor's Type
 *         logo:
 *           type: string
 *           description: Link to Sponsor's Logo
 *         sequence:
 *           type: number
 *           description: Sequence number
 *         featured:
 *           type: boolean
 *           description: Whether the sponsor is featured
 */

/**
 * @swagger
 * /sponsors/conference/{id}:
 *   get:
 *     summary: Get sponsors by conference ID
 *     tags: [Sponsors]
 *     description: Retrieve sponsors based on the conference ID
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
 *         description: Sponsor not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /sponsors:
 *   get:
 *     tags: [Sponsors]
 *     summary: Get all sponsors
 *     description: Retrieve all sponsors
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags: [Sponsors]
 *     summary: Create a new sponsor
 *     description: Create a new sponsor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SponsorsModel'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /sponsors/{id}:
 *   get:
 *     tags: [Sponsors]
 *     summary: Get a sponsor by ID
 *     description: Retrieve a sponsor by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Sponsor ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Sponsor not found
 *       500:
 *         description: Internal server error
 *   put:
 *     tags: [Sponsors]
 *     summary: Update a sponsor by ID
 *     description: Update a sponsor by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Sponsor ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SponsorsModel'
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Sponsor not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags: [Sponsors]
 *     summary: Delete a sponsor by ID
 *     description: Delete a sponsor by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Sponsor ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Sponsor not found
 *       500:
 *         description: Internal server error
 */

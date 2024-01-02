/**
 * @swagger
 * tags:
 *   name: Home
 *   description: API endpoints for Home.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Home:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Home ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         confName:
 *           type: string
 *           description: Conference Name
 *         confStartDate:
 *           type: string
 *           format: date-time
 *           description: Conference Start Date
 *         confEndDate:
 *           type: string
 *           format: date-time
 *           description: Conference End Date
 *         aboutConf:
 *           type: string
 *           description: About the Conference
 *         aboutIns:
 *           type: string
 *           description: About the Institution
 *         youtubeLink:
 *           type: string
 *           description: YouTube Link
 *         instaLink:
 *           type: string
 *           description: Instagram Link
 *         facebookLink:
 *           type: string
 *           description: Facebook Link
 *         twitterLink:
 *           type: string
 *           description: Twitter Link
 *         logo:
 *           type: string
 *           description: Logo URL
 *         shortName:
 *           type: string
 *           description: Short Name
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
 * /home:
 *   get:
 *     tags: [Home]
 *     summary: Get all home data
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Home'
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     tags: [Home]
 *     summary: Create a new home data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Home'
 *     responses:
 *       201:
 *         description: Success
 *       500:
 *         description: Internal server error
 *
 * /home/{id}:
 *   get:
 *     tags: [Home]
 *     summary: Get home data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Home ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Home'
 *       404:
 *         description: Home not found
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     tags: [Home]
 *     summary: Update home data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Home ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Home'
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       404:
 *         description: Home not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     tags: [Home]
 *     summary: Delete home data by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Home ID
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Home not found
 *       500:
 *         description: Internal server error
 */

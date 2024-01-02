/**
 * @swagger
 * tags:
 *   name: Announcement
 *   description: API endpoints for Announcement.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       properties:
 *         confId:
 *           type: string
 *           description: Conference ID
 *         title:
 *           type: string
 *           description: Announcement title
 *         metaDescription:
 *           type: string
 *           description: Announcement meta description
 *         description:
 *           type: string
 *           description: Announcement description
 *         feature:
 *           type: boolean
 *           description: Indicates if the announcement is featured
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering announcements
 *         new:
 *           type: boolean
 *           description: Indicates if the announcement is new
 *         hidden:
 *           type: boolean
 *           description: Indicates if the announcement is hidden
 *         link:
 *           type: string
 *           description: Announcement link
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Announcement creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Announcement last update date
 */

/**
 * @swagger
 * /announcement:
 *   get:
 *     tags: [Announcement]
 *     summary: Get all Announcements
 *     description: Retrieve all announcements
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Announcement]
 *     summary: Create a new Announcement
 *     description: Create a new Announcement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Announcement'
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
 * /announcement/{id}:
 *   get:
 *     tags: [Announcement]
 *     summary: Get an Announcement by ID
 *     description: Retrieve an announcement by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
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
 *   put:
 *     tags: [Announcement]
 *     summary: Update an Announcement by ID
 *     description: Update an announcement by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Announcement ID
 *     requestBody:
 *       description: Updated Announcement object
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Announcement'
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
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
 *   delete:
 *     tags: [Announcement]
 *     summary: Delete an Announcement by ID
 *     description: Delete an announcement by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

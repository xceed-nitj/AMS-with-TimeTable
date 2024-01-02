/**
 * @swagger
 * tags:
 *   name: Committees
 *   description: API endpoints for Committees
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Committee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Committee ID
 *         ConfId:
 *           type: string
 *           description: Conference ID
 *         Type:
 *           type: string
 *           description: Committee Type
 *         Subtype:
 *           type: string
 *           description: Committee Subtype
 *         Name:
 *           type: string
 *           description: Committee Name
 *         Designation:
 *           type: string
 *           description: Committee Designation
 *         Institute:
 *           type: string
 *           description: Committee Institute
 *         ProfileLink:
 *           type: string
 *           description: Committee Profile Link
 *         ImgLink:
 *           type: string
 *           description: Committee Image Link
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering committees
 *         feature:
 *           type: boolean
 *           description: Indicates if the committee is featured
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Committee creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Committee last update date
 */

/**
 * @swagger
 * /committees/conference/{id}:
 *   get:
 *     tags: [Committees]
 *     summary: Get committees by conference ID
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Committee'
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
 *         description: No committees found for the given conference
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
 * /committees:
 *   get:
 *     tags: [Committees]
 *     summary: Get all committees
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Committee'
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
 *     tags: [Committees]
 *     summary: Create a new committee
 *     requestBody:
 *       description: Committee object to be added
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Committee'
 *     responses:
 *       201:
 *         description: Committee added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Committee'
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
 * /committees/{id}:
 *   get:
 *     tags: [Committees]
 *     summary: Get a committee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Committee ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Committee'
 *       404:
 *         description: Committee not found
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
 *     tags: [Committees]
 *     summary: Update a committee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Committee ID
 *     requestBody:
 *       description: Committee object to be updated
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Committee'
 *     responses:
 *       200:
 *         description: Committee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Committee'
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
 *         description: Committee not found
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
 *     tags: [Committees]
 *     summary: Delete a committee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Committee ID
 *     responses:
 *       200:
 *         description: Committee deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Committee'
 *       404:
 *         description: Committee not found
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

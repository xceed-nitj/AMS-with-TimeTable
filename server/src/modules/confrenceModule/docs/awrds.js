/**
 * @swagger
 * tags:
 *   name: Awards
 *   description: API endpoints for Awards.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Award:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Award ID
 *         confId:
 *           type: string
 *           description: Conference ID
 *         title1:
 *           type: string
 *           description: Award title (part 1)
 *         title2:
 *           type: string
 *           description: Award title (part 2)
 *         description:
 *           type: string
 *           description: Award description
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering awards
 *         featured:
 *           type: boolean
 *           description: Indicates if the award is featured
 *         new:
 *           type: boolean
 *           description: Indicates if the award is new
 *         hidden:
 *           type: boolean
 *           description: Indicates if the award is hidden
 *         link:
 *           type: string
 *           description: Award link
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Award creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Award last update date
 */

/**
 * @swagger
 * /awards/conference/{id}:
 *   get:
 *     tags: [Awards]
 *     summary: Get all Awards by Conference ID
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
 *                 $ref: '#/components/schemas/Award'
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
 *         description: No awards found for the given conference
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
 * /awards:
 *   get:
 *     tags: [Awards]
 *     summary: Get all Awards
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Award'
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
 *     tags: [Awards]
 *     summary: Create a new Award
 *     requestBody:
 *       description: Award object to be added
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Award'
 *     responses:
 *       201:
 *         description: Award added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Award'
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
 * /awards/{id}:
 *   get:
 *     tags: [Awards]
 *     summary: Get an Award by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Award ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Award'
 *       404:
 *         description: Award not found
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
 *     tags: [Awards]
 *     summary: Update an Award by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Award ID
 *     requestBody:
 *       description: Award object to be updated
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Award'
 *     responses:
 *       200:
 *         description: Award updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Award'
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
 *         description: Award not found
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
 *     tags: [Awards]
 *     summary: Delete an Award by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Award ID
 *     responses:
 *       200:
 *         description: Award deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Award not found
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
